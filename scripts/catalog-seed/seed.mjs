/** Seed six original RegenAI concepts as unpublished DRAFT products in a verified dev store.
 * Default is read-only. Apply requires the exact local plan digest and never publishes.
 */
import {existsSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSeedPlan} from './plan.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const {settings, report} = buildSeedPlan(root);
const manifestPath = resolve(root, 'memory/shopify-seed-ownership.json');
const args = process.argv.slice(2);
const apply = args[0] === '--apply' && args.length === 3;
const verifyOnly = args.length === 1 && args[0] === '--verify';
if (!(apply || verifyOnly || args.length === 0 || (args.length === 1 && args[0] === '--dry-run'))) {
  throw new Error('Usage: seed.mjs [--dry-run | --verify | --apply <plan-sha256> <settings-sha256>]');
}
if (apply && (args[1] !== report.planSha256 || args[2] !== report.settingsSha256)) {
  throw new Error('Plan or settings digest mismatch. Re-run the dry run and review the changed inputs.');
}

const shop = process.env.PUBLIC_STORE_DOMAIN;
const expectedShop = process.env.SHOPIFY_SEED_EXPECTED_SHOP;
const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION;
if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop ?? '') ||
    shop !== expectedShop || !/^\d{4}-(?:01|04|07|10)$/.test(apiVersion ?? '') || !token) {
  throw new Error('Set a valid shop, matching explicit seed target, Admin API version and token.');
}
const adminUrl = `https://${shop}/admin/api/${apiVersion}/graphql.json`;
const markerKey = settings.markerKey;
const markerNamespace = '$app';

async function graphql(query, variables = {}) {
  const response = await fetch(adminUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
    body: JSON.stringify({query, variables}),
    signal: AbortSignal.timeout(settings.requestTimeoutMs),
  });
  if (!response.ok) throw new Error(`Shopify Admin returned HTTP ${response.status}.`);
  const body = await response.json();
  if (body.errors?.length || !body.data) {
    const messages = (body.errors ?? []).map(({message}) => String(message).slice(0, 200)).join('; ');
    throw new Error(`Shopify Admin rejected ${query.match(/(?:query|mutation)\s+(\w+)/)?.[1] ?? 'operation'}: ${messages || 'empty data'}.`);
  }
  return body.data;
}

const preflightQuery = `query SeedPreflight($after: String, $markerKey: String!) {
  shop { myshopifyDomain currencyCode plan { partnerDevelopment } }
  currentAppInstallation { accessScopes { handle } }
  metafieldDefinition(identifier: {ownerType: PRODUCT, namespace: "$app", key: $markerKey}) {
    id namespace key type { name }
  }
  products(first: 100, after: $after) {
    nodes {
      id handle title status
      metafield(namespace: "$app", key: $markerKey) { value }
      variants(first: 100) { nodes { sku } pageInfo { hasNextPage } }
    }
    pageInfo { hasNextPage endCursor }
  }
  publications(first: 100) {
    nodes { id name autoPublish catalog { __typename status }
      channels(first: 20) { nodes { app { title } } pageInfo { hasNextPage } } }
    pageInfo { hasNextPage }
  }
}`;

function readManifest() {
  if (!existsSync(manifestPath)) return {schema: 1, shop, apiVersion,
    planSha256: report.planSha256, settingsSha256: report.settingsSha256, records: {}};
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.schema !== 1 || manifest.shop !== shop || manifest.apiVersion !== apiVersion ||
      manifest.planSha256 !== report.planSha256 || manifest.settingsSha256 !== report.settingsSha256 ||
      typeof manifest.records !== 'object' || !manifest.records) {
    throw new Error('Private ownership manifest does not match this exact shop, API version and plan.');
  }
  return manifest;
}

function saveManifest(manifest) {
  manifest.updatedAt = new Date().toISOString();
  const temporary = `${manifestPath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, {mode: 0o600});
  renameSync(temporary, manifestPath);
}

function assertNoCollisions(products, manifest) {
  const byId = new Map(report.records.map((record) => [record.fixtureId, record]));
  const seenOwned = new Set();
  const handles = new Set(report.records.map((record) => record.handle));
  const titles = new Set(report.records.map((record) => record.title));
  const skus = new Set(report.records.flatMap((record) => record.variants.map((variant) => variant.sku)));
  for (const product of products) {
    const marker = product.metafield?.value;
    const markerMatch = typeof marker === 'string' && marker.startsWith(settings.markerPrefix);
    const matchingSku = product.variants.nodes.some((variant) => skus.has(variant.sku));
    const collision = handles.has(product.handle) || titles.has(product.title) || matchingSku || markerMatch;
    if (!collision) continue;
    const id = markerMatch ? marker.slice(settings.markerPrefix.length) : null;
    const planned = byId.get(id);
    const owned = id && manifest.records[id];
    if (!planned || !owned || owned.productId !== product.id ||
        product.handle !== planned.handle || product.title !== planned.title || seenOwned.has(id)) {
      throw new Error('A planned handle, title, SKU or ownership marker collides with an unowned product.');
    }
    const actualSkus = product.variants.nodes.map((variant) => variant.sku).sort();
    const plannedSkus = planned.variants.map((variant) => variant.sku).sort();
    if (JSON.stringify(actualSkus) !== JSON.stringify(plannedSkus) || product.status !== 'DRAFT') {
      throw new Error(`Owned product ${id} drifted from its draft seed state.`);
    }
    seenOwned.add(id);
  }
  for (const id of Object.keys(manifest.records)) {
    if (!seenOwned.has(id)) throw new Error(`Manifest product ${id} is missing from the complete Shopify scan.`);
  }
  return seenOwned;
}

async function preflight(manifest) {
  let after = null;
  let count = 0;
  let first = null;
  const products = [];
  do {
    const page = await graphql(preflightQuery, {after, markerKey});
    if (!first) first = page;
    if (page.products.nodes.some((product) => product.variants.pageInfo.hasNextPage)) {
      throw new Error('Variant pagination is incomplete.');
    }
    products.push(...page.products.nodes);
    count++;
    if (count > 100 || (page.products.pageInfo.hasNextPage && !page.products.pageInfo.endCursor)) {
      throw new Error('Product pagination did not complete.');
    }
    after = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
  } while (after);
  if (first.shop.myshopifyDomain !== shop || !first.shop.plan.partnerDevelopment ||
      first.shop.currencyCode !== settings.currency) {
    throw new Error('Shop identity, development-store status or currency differs from the seed plan.');
  }
  const scopes = new Set(first.currentAppInstallation.accessScopes.map(({handle}) => handle));
  for (const scope of ['read_products', 'write_products', 'read_files', 'write_files', 'read_publications']) {
    if (!scopes.has(scope)) throw new Error(`Missing required Admin scope: ${scope}.`);
  }
  const publications = first.publications;
  if (publications.pageInfo.hasNextPage || publications.nodes.some((node) => node.channels.pageInfo.hasNextPage)) {
    throw new Error('Publication inventory pagination is incomplete.');
  }
  const matchingChannels = publications.nodes.filter((node) =>
    node.name === settings.headlessPublicationName &&
    node.channels.nodes.some((channel) => channel.app.title === settings.headlessAppTitle));
  if (matchingChannels.length !== 1 || matchingChannels[0].autoPublish ||
      matchingChannels[0].catalog?.status !== 'ACTIVE') {
    throw new Error('The expected distinct Headless publication is unavailable.');
  }
  const definition = first.metafieldDefinition;
  if (definition && (definition.key !== markerKey || definition.type.name !== 'id' ||
      typeof definition.namespace !== 'string' ||
      !(definition.namespace === '$app' || definition.namespace.startsWith('app--')))) {
    throw new Error('Existing ownership metafield definition has an unexpected type or key.');
  }
  const owned = assertNoCollisions(products, manifest);
  return {productCount: products.length, owned, definition, publication: matchingChannels[0]};
}

const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

async function ensureDefinition(definition) {
  if (definition) return definition;
  const mutation = `mutation CreateSeedDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id key namespace type { name } }
      userErrors { code field message }
    }
  }`;
  const data = await graphql(mutation, {definition: {name: 'RegenAI seed key',
    namespace: markerNamespace, key: markerKey, ownerType: 'PRODUCT', type: 'id',
    description: 'Stable ID for the six private portfolio-demo concept records.'}});
  const result = data.metafieldDefinitionCreate;
  if (result.userErrors.length || !result.createdDefinition ||
      result.createdDefinition.type.name !== 'id') {
    throw new Error('Could not create the owned custom ID definition.');
  }
  return result.createdDefinition;
}

async function stageImage(record) {
  const path = resolve(root, 'packages/storefront/public', record.image.localName.slice(1));
  const bytes = readFileSync(path);
  const filename = `${record.fixtureId}.png`;
  const mutation = `mutation StageConceptImage($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { field message }
    }
  }`;
  const data = await graphql(mutation, {input: [{resource: 'PRODUCT_IMAGE', filename,
    mimeType: 'image/png', httpMethod: 'POST', fileSize: String(bytes.length)}]});
  const result = data.stagedUploadsCreate;
  if (result.userErrors.length || result.stagedTargets.length !== 1) {
    throw new Error(`Could not stage image for ${record.fixtureId}.`);
  }
  const target = result.stagedTargets[0];
  const uploadUrl = new URL(target.url);
  const sourceUrl = new URL(target.resourceUrl);
  if (uploadUrl.protocol !== 'https:' || sourceUrl.protocol !== 'https:') {
    throw new Error('Shopify returned a non-HTTPS staged upload target.');
  }
  const form = new FormData();
  for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
  form.append('file', new Blob([bytes], {type: 'image/png'}), filename);
  const response = await fetch(uploadUrl, {method: 'POST', body: form,
    signal: AbortSignal.timeout(settings.requestTimeoutMs)});
  if (!response.ok) throw new Error(`Staged image upload for ${record.fixtureId} returned HTTP ${response.status}.`);
  return sourceUrl.toString();
}

const productQuery = `query VerifySeedProduct($id: ID!, $publicationId: ID!, $markerKey: String!) {
  product(id: $id) {
    id title handle status productType vendor tags
    publishedOnPublication(publicationId: $publicationId)
    metafield(namespace: "$app", key: $markerKey) { value }
    variants(first: 10) { nodes { id sku price selectedOptions { name value } } pageInfo { hasNextPage } }
    media(first: 10) { nodes { id alt status mediaContentType } pageInfo { hasNextPage } }
  }
}`;

async function verifyRecord(record, productId, publicationId) {
  for (let attempt = 0; attempt < settings.mediaPollAttempts; attempt++) {
    const product = (await graphql(productQuery, {id: productId, publicationId, markerKey})).product;
    if (!product || product.id !== productId || product.title !== record.title ||
        product.handle !== record.handle || product.status !== 'DRAFT' ||
        product.publishedOnPublication || product.productType !== record.productType ||
        product.vendor !== settings.vendor ||
        !record.tags.every((tag) => product.tags.includes(tag)) ||
        product.metafield?.value !== record.ownershipMarker ||
        product.variants.pageInfo.hasNextPage || product.variants.nodes.length !== 2 ||
        product.media.pageInfo.hasNextPage || product.media.nodes.length !== 1) {
      throw new Error(`Read-back mismatch for ${record.fixtureId}.`);
    }
    for (const variant of record.variants) {
      const actual = product.variants.nodes.find(({sku}) => sku === variant.sku);
      if (!actual || Number(actual.price).toFixed(2) !== variant.illustrativePrice ||
          actual.selectedOptions.length !== 1 ||
          actual.selectedOptions[0].name !== variant.optionName ||
          actual.selectedOptions[0].value !== variant.value) {
        throw new Error(`Variant read-back mismatch for ${record.fixtureId}.`);
      }
    }
    const media = product.media.nodes[0];
    if (media.status === 'READY' && media.mediaContentType === 'IMAGE' &&
        media.alt === settings.imageAltTemplate.replace('{name}', record.title)) {
      return {productId, variants: product.variants.nodes.map(({id, sku}) => ({id, sku})),
        mediaId: media.id, mediaStatus: media.status, verified: true};
    }
    if (media.status === 'FAILED') throw new Error(`Image processing failed for ${record.fixtureId}.`);
    await new Promise((resolveWait) => setTimeout(resolveWait, settings.mediaPollDelayMs));
  }
  throw new Error(`Image was not ready for ${record.fixtureId}; retry read-back later.`);
}

async function createRecord(record, namespace) {
  const source = await stageImage(record);
  const mutation = `mutation CreateSeedProduct($input: ProductSetInput!) {
    productSet(input: $input, synchronous: true) {
      product { id }
      userErrors { code field message }
    }
  }`;
  const input = {
    title: record.title, handle: record.handle, status: 'DRAFT',
    vendor: settings.vendor, productType: record.productType, tags: record.tags,
    descriptionHtml: `<p>${escapeHtml(record.summary)}</p><p>${escapeHtml(record.detail)}</p><p>${escapeHtml(settings.descriptionNotice)}</p>`,
    metafields: [{namespace, key: markerKey, type: 'id', value: record.ownershipMarker}],
    productOptions: [{name: record.variants[0].optionName, position: 1,
      values: record.variants.map(({value}) => ({name: value}))}],
    variants: record.variants.map(({optionName, value, sku, illustrativePrice}) => ({
      optionValues: [{optionName, name: value}], sku, price: illustrativePrice,
      published: false, inventoryPolicy: 'DENY',
    })),
    files: [{originalSource: source, filename: `${record.fixtureId}.png`, contentType: 'IMAGE',
      alt: settings.imageAltTemplate.replace('{name}', record.title)}],
  };
  const data = await graphql(mutation, {input});
  const result = data.productSet;
  if (result.userErrors.length || !result.product?.id) {
    const errors = result.userErrors.map(({code, field, message}) =>
      `${code ?? 'UNKNOWN'} ${JSON.stringify(field)} ${String(message).slice(0, 200)}`).join('; ');
    throw new Error(`productSet did not confirm creation of ${record.fixtureId}: ${errors || 'no product ID'}.`);
  }
  return result.product.id;
}

const manifest = readManifest();
const state = await preflight(manifest);
console.log(JSON.stringify({mode: apply ? 'apply' : verifyOnly ? 'verify' : 'dry-run', shop,
  productCount: report.productCount, variantCount: report.variantCount,
  preexistingProductCount: state.productCount, ownedCount: state.owned.size,
  toCreate: report.productCount - state.owned.size, status: 'DRAFT', publication: 'none',
  verifiedHeadlessPublication: state.publication.name,
  planSha256: report.planSha256, settingsSha256: report.settingsSha256}));
if (verifyOnly) {
  if (state.owned.size !== report.productCount) {
    throw new Error('Cannot verify a partial seed as complete.');
  }
  for (const record of report.records) {
    const owned = manifest.records[record.fixtureId];
    if (!owned?.productId) throw new Error(`Missing ownership for ${record.fixtureId}.`);
    await verifyRecord(record, owned.productId, state.publication.id);
  }
  console.log(JSON.stringify({verifiedDrafts: report.productCount,
    verifiedVariants: report.variantCount, mediaReady: report.productCount,
    publishedOnHeadless: 0, remoteWrites: 0}));
}
if (apply) {
  const definition = await ensureDefinition(state.definition);
  for (const record of report.records) {
    const existing = manifest.records[record.fixtureId];
    if (existing) {
      const verified = await verifyRecord(record, existing.productId, state.publication.id);
      manifest.records[record.fixtureId] = {...existing, ...verified};
      saveManifest(manifest);
      continue;
    }
    const productId = await createRecord(record, definition.namespace);
    manifest.records[record.fixtureId] = {productId, marker: record.ownershipMarker,
      sourceImageSha256: record.image.sha256, verified: false, createdAt: new Date().toISOString()};
    saveManifest(manifest);
    const verified = await verifyRecord(record, productId, state.publication.id);
    manifest.records[record.fixtureId] = {...manifest.records[record.fixtureId], ...verified};
    saveManifest(manifest);
    console.log(JSON.stringify({created: record.fixtureId, status: 'DRAFT', verified: true}));
  }
  console.log(JSON.stringify({complete: true, drafts: Object.keys(manifest.records).length,
    published: 0, ownershipManifestSavedPrivately: true}));
}
