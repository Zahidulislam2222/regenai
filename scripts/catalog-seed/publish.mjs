/** Publish only the six owned concept products to the verified dev-store Headless publication.
 * Default is read-only. Apply is digest-guarded and verifies every remote write.
 */
import {readFileSync, renameSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSeedPlan} from './plan.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const {settings, report} = buildSeedPlan(root);
const args = process.argv.slice(2);
const apply = args[0] === '--apply' && args.length === 3;
const verify = args[0] === '--verify' && args.length === 1;
if (!(apply || verify || args.length === 0 || (args.length === 1 && args[0] === '--dry-run'))) {
  throw new Error('Usage: publish.mjs [--dry-run | --verify | --apply <plan-sha256> <settings-sha256>]');
}
if (apply && (args[1] !== report.planSha256 || args[2] !== report.settingsSha256)) {
  throw new Error('Plan or settings digest mismatch. Re-run the dry run before publishing.');
}

const shop = process.env.PUBLIC_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION;
if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop ?? '') ||
    shop !== process.env.SHOPIFY_SEED_EXPECTED_SHOP ||
    !/^\d{4}-(?:01|04|07|10)$/.test(apiVersion ?? '') || !token) {
  throw new Error('A matching explicit development shop, Admin API version, and token are required.');
}

const ownershipPath = resolve(root, 'memory/shopify-seed-ownership.json');
const inventoryPath = resolve(root, 'memory/shopify-publication-inventory.json');
const statePath = resolve(root, 'memory/shopify-publish-state.json');
const ownership = JSON.parse(readFileSync(ownershipPath, 'utf8'));
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));
if (ownership.shop !== shop || inventory.shop !== shop || ownership.apiVersion !== apiVersion ||
    inventory.apiVersion !== apiVersion || ownership.planSha256 !== report.planSha256 ||
    ownership.settingsSha256 !== report.settingsSha256 ||
    Object.keys(ownership.records ?? {}).sort().join(',') !== settings.expectedIds.slice().sort().join(',')) {
  throw new Error('Private ownership and publication inventories do not match this exact seed plan.');
}
const savedHeadless = inventory.publications.filter((publication) =>
  publication.name === settings.headlessPublicationName &&
  publication.channels?.nodes?.some((channel) => channel.app?.title === settings.headlessAppTitle));
if (savedHeadless.length !== 1 || savedHeadless[0].autoPublish !== false ||
    savedHeadless[0].catalog?.status !== 'ACTIVE') {
  throw new Error('Saved exact Headless publication identity is unavailable.');
}
const publicationId = savedHeadless[0].id;
const adminUrl = `https://${shop}/admin/api/${apiVersion}/graphql.json`;

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
    throw new Error(`Shopify Admin rejected ${query.match(/(?:query|mutation)\s+(\w+)/)?.[1] ?? 'operation'}.`);
  }
  return body.data;
}

const preflightQuery = `query PublicationPreflight {
  shop { myshopifyDomain currencyCode plan { partnerDevelopment } }
  currentAppInstallation { accessScopes { handle } }
  publications(first: 100) {
    nodes { id name autoPublish catalog { __typename status }
      channels(first: 20) { nodes { app { title } } pageInfo { hasNextPage } } }
    pageInfo { hasNextPage }
  }
}`;

async function preflight() {
  const data = await graphql(preflightQuery);
  if (data.shop.myshopifyDomain !== shop || !data.shop.plan.partnerDevelopment ||
      data.shop.currencyCode !== settings.currency) {
    throw new Error('Shop identity, development-store status, or currency changed.');
  }
  const scopes = new Set(data.currentAppInstallation.accessScopes.map(({handle}) => handle));
  for (const scope of ['read_products', 'write_products', 'read_publications', 'write_publications']) {
    if (!scopes.has(scope)) throw new Error(`Missing required Admin scope: ${scope}.`);
  }
  const live = data.publications;
  if (live.pageInfo.hasNextPage || live.nodes.some((item) => item.channels.pageInfo.hasNextPage) ||
      live.nodes.length !== inventory.publications.length) {
    throw new Error('Current publication inventory is incomplete or changed.');
  }
  for (const expected of inventory.publications) {
    const actual = live.nodes.find((item) => item.id === expected.id);
    if (!actual || actual.name !== expected.name || actual.autoPublish !== false ||
        actual.catalog?.status !== expected.catalog?.status ||
        JSON.stringify(actual.channels.nodes.map((item) => item.app?.title).sort()) !==
          JSON.stringify(expected.channels.nodes.map((item) => item.app?.title).sort())) {
      throw new Error('Current publication inventory drifted from the reviewed snapshot.');
    }
  }
  return live.nodes.find((item) => item.id === publicationId);
}

const productQuery = `query VerifyConceptPublication($id: ID!, $markerKey: String!) {
  product(id: $id) {
    id title handle status productType vendor tags
    metafield(namespace: "$app", key: $markerKey) { value }
    variants(first: 100) { nodes {
      id sku price selectedOptions { name value }
      resourcePublications(first: 100) {
        nodes { publication { id } isPublished }
        pageInfo { hasNextPage }
      }
    } pageInfo { hasNextPage } }
    media(first: 10) { nodes { id alt status mediaContentType } pageInfo { hasNextPage } }
    resourcePublications(first: 100) {
      nodes { publication { id } isPublished }
      pageInfo { hasNextPage }
    }
  }
}`;

async function readConcept(record) {
  const owned = ownership.records[record.fixtureId];
  const product = (await graphql(productQuery, {id: owned.productId, markerKey: settings.markerKey})).product;
  if (!product || product.id !== owned.productId || product.title !== record.title ||
      product.handle !== record.handle || product.productType !== record.productType ||
      product.vendor !== settings.vendor || product.metafield?.value !== record.ownershipMarker ||
      !record.tags.every((tag) => product.tags.includes(tag)) ||
      product.variants.pageInfo.hasNextPage || product.variants.nodes.length !== record.variants.length ||
      product.media.pageInfo.hasNextPage || product.media.nodes.length !== 1 ||
      product.media.nodes[0].id !== owned.mediaId || product.media.nodes[0].status !== 'READY' ||
      product.media.nodes[0].mediaContentType !== 'IMAGE' ||
      product.resourcePublications.pageInfo.hasNextPage) {
    throw new Error(`Owned concept ${record.fixtureId} failed integrity verification.`);
  }
  for (const planned of record.variants) {
    const actual = product.variants.nodes.find((item) => item.sku === planned.sku);
    if (!actual || !owned.variants.some((item) => item.id === actual.id && item.sku === actual.sku) ||
        Number(actual.price).toFixed(2) !== planned.illustrativePrice ||
        actual.selectedOptions.length !== 1 || actual.selectedOptions[0].name !== planned.optionName ||
        actual.selectedOptions[0].value !== planned.value ||
        actual.resourcePublications.pageInfo.hasNextPage ||
        actual.resourcePublications.nodes.some((item) => item.isPublished && item.publication.id !== publicationId)) {
      throw new Error(`Owned concept ${record.fixtureId} variant drifted.`);
    }
  }
  const publishedIds = product.resourcePublications.nodes.filter((item) => item.isPublished)
    .map((item) => item.publication.id);
  if (publishedIds.some((id) => id !== publicationId) ||
      (product.status !== 'DRAFT' && product.status !== 'ACTIVE') ||
      (product.status === 'DRAFT' && publishedIds.length > 0)) {
    throw new Error(`Owned concept ${record.fixtureId} has unexpected publication or status.`);
  }
  return {id: product.id, status: product.status, publishedIds,
    variants: product.variants.nodes.map((variant) => ({id: variant.id,
      publishedIds: variant.resourcePublications.nodes.filter((item) => item.isPublished)
        .map((item) => item.publication.id)}))};
}

function saveState(records) {
  const value = {schema: 1, shop, apiVersion, planSha256: report.planSha256,
    settingsSha256: report.settingsSha256, publicationId, records,
    updatedAt: new Date().toISOString()};
  const temp = `${statePath}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, {mode: 0o600});
  renameSync(temp, statePath);
}

const activateMutation = `mutation ActivateConcept($product: ProductUpdateInput!) {
  productUpdate(product: $product) { product { id status } userErrors { field message } }
}`;
const publishMutation = `mutation PublishConcept($id: ID!, $input: [PublicationInput!]!, $publicationId: ID!) {
  publishablePublish(id: $id, input: $input) {
    publishable { publishedOnPublication(publicationId: $publicationId) }
    userErrors { field message }
  }
}`;

await preflight();
const records = new Map();
for (const record of report.records) records.set(record.fixtureId, await readConcept(record));
const before = [...records.values()];
console.log(JSON.stringify({mode: apply ? 'apply' : verify ? 'verify' : 'dry-run', shop,
  concepts: before.length, drafts: before.filter((item) => item.status === 'DRAFT').length,
  active: before.filter((item) => item.status === 'ACTIVE').length,
  publishedOnHeadless: before.filter((item) => item.publishedIds.includes(publicationId)).length,
  variantsOnHeadless: before.flatMap((item) => item.variants)
    .filter((item) => item.publishedIds.includes(publicationId)).length,
  publication: settings.headlessPublicationName, planSha256: report.planSha256,
  settingsSha256: report.settingsSha256}));
if (verify) {
  if (!before.every((item) => item.status === 'ACTIVE' &&
      item.publishedIds.length === 1 && item.publishedIds[0] === publicationId &&
      item.variants.every((variant) => variant.publishedIds.length === 1 &&
        variant.publishedIds[0] === publicationId))) {
    throw new Error('The six Headless concepts and twelve variants are not all published.');
  }
  console.log(JSON.stringify({verifiedProducts: report.productCount, verifiedVariants: report.variantCount,
    otherPublications: 0, remoteWrites: 0}));
}
if (apply) {
  const progress = {};
  for (const record of report.records) {
    const prior = records.get(record.fixtureId);
    let current = prior;
    if (current.status === 'DRAFT') {
      const changed = (await graphql(activateMutation, {product: {id: current.id, status: 'ACTIVE'}})).productUpdate;
      if (changed.userErrors.length || changed.product?.id !== current.id || changed.product?.status !== 'ACTIVE') {
        throw new Error(`Activation failed for ${record.fixtureId}.`);
      }
      current = await readConcept(record);
      if (current.status !== 'ACTIVE' || current.publishedIds.length !== 0) {
        throw new Error(`Activation changed unexpected publications for ${record.fixtureId}.`);
      }
      progress[record.fixtureId] = {status: 'ACTIVE', publishedOnHeadless: false};
      saveState(progress);
    }
    if (!current.publishedIds.includes(publicationId)) {
      const changed = (await graphql(publishMutation, {id: current.id, input: [{publicationId}], publicationId})).publishablePublish;
      if (changed.userErrors.length || !changed.publishable?.publishedOnPublication) {
        throw new Error(`Headless publication failed for ${record.fixtureId}.`);
      }
      current = await readConcept(record);
      if (current.status !== 'ACTIVE' || current.publishedIds.length !== 1 ||
          current.publishedIds[0] !== publicationId) {
        throw new Error(`Publication read-back failed for ${record.fixtureId}.`);
      }
    }
    for (const planned of record.variants) {
      const ownedVariant = ownership.records[record.fixtureId].variants.find((variant) => variant.sku === planned.sku);
      const state = current.variants.find((variant) => variant.id === ownedVariant.id);
      if (!state) throw new Error(`Missing owned variant ${record.fixtureId}.`);
      if (!state.publishedIds.includes(publicationId)) {
        const changed = (await graphql(publishMutation, {id: state.id,
          input: [{publicationId}], publicationId})).publishablePublish;
        if (changed.userErrors.length || !changed.publishable?.publishedOnPublication) {
          throw new Error(`Headless variant publication failed for ${record.fixtureId}.`);
        }
        current = await readConcept(record);
        const verifiedVariant = current.variants.find((variant) => variant.id === state.id);
        if (!verifiedVariant || verifiedVariant.publishedIds.length !== 1 ||
            verifiedVariant.publishedIds[0] !== publicationId) {
          throw new Error(`Variant publication read-back failed for ${record.fixtureId}.`);
        }
      }
    }
    progress[record.fixtureId] = {status: 'ACTIVE', publishedOnHeadless: true,
      variantsOnHeadless: current.variants.length};
    saveState(progress);
    console.log(JSON.stringify({concept: record.fixtureId, active: true, headlessOnly: true,
      variantsOnHeadless: current.variants.length}));
  }
  console.log(JSON.stringify({complete: true, active: report.productCount,
    publishedOnHeadless: report.productCount, variantsOnHeadless: report.variantCount,
    otherPublications: 0}));
}
