import {createHash} from 'node:crypto';
import {readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const skuSlug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export function buildSeedPlan(root) {
  const source = readFileSync(resolve(root, 'packages/storefront/app/content/recovery-catalog.json'));
  const catalog = JSON.parse(source.toString('utf8'));
  const settingsSource = readFileSync(resolve(root, 'scripts/catalog-seed/seed-config.json'));
  const settings = JSON.parse(settingsSource.toString('utf8'));
  const expected = new Set(settings.expectedIds);
  if (!Array.isArray(catalog) || catalog.length !== expected.size || expected.size !== 6 ||
      Object.keys(settings.optionNames).length !== expected.size ||
      !/^[A-Z]{3}$/.test(settings.currency) || settings.currency !== settings.sourceCurrency ||
      typeof settings.vendor !== 'string' || !settings.vendor.trim() ||
      typeof settings.descriptionNotice !== 'string' || !settings.descriptionNotice.trim() ||
      typeof settings.headlessPublicationName !== 'string' || !settings.headlessPublicationName.trim() ||
      typeof settings.headlessAppTitle !== 'string' || !settings.headlessAppTitle.trim() ||
      !/^[a-z][a-z0-9_-]+$/.test(settings.markerKey) ||
      !/^[a-z0-9-]+:$/.test(settings.markerPrefix) ||
      !/^[a-z0-9-]+-$/.test(settings.handlePrefix) ||
      !/^[A-Z0-9-]+-$/.test(settings.skuPrefix) ||
      !settings.imageAltTemplate.includes('{name}') ||
      !Array.isArray(settings.tags) || settings.tags.length !== 2 ||
      !Number.isSafeInteger(settings.requestTimeoutMs) || settings.requestTimeoutMs <= 0 ||
      !Number.isSafeInteger(settings.mediaPollAttempts) || settings.mediaPollAttempts <= 0 ||
      !Number.isSafeInteger(settings.mediaPollDelayMs) || settings.mediaPollDelayMs <= 0) {
    throw new Error('The six-concept seed configuration is incomplete.');
  }
  const ids = new Set();
  const handles = new Set();
  const skus = new Set();
  const records = catalog.map((item) => {
    if (typeof item.id !== 'string' || !expected.has(item.id) || ids.has(item.id) ||
        typeof item.name !== 'string' || !item.name.trim() ||
        typeof item.kind !== 'string' || !item.kind.trim() ||
        typeof item.category !== 'string' || !item.category.trim() ||
        typeof item.description !== 'string' || !item.description.trim() ||
        typeof item.detail !== 'string' || !item.detail.trim() ||
        !Array.isArray(item.specs) || !Number.isSafeInteger(item.price) || item.price <= 0 ||
        !Array.isArray(item.options) || item.options.length !== 2 ||
        new Set(item.options).size !== 2 ||
        typeof settings.optionNames[item.id] !== 'string' || !settings.optionNames[item.id] ||
        !/^\/media\/[a-z0-9-]+\.png$/.test(item.image)) {
      throw new Error('Invalid or duplicate concept source record.');
    }
    ids.add(item.id);
    const imagePath = resolve(root, 'packages/storefront/public', item.image.slice(1));
    const image = readFileSync(imagePath);
    if (image.length < 8 || image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw new Error('Expected a non-empty PNG concept image.');
    }
    const handle = `${settings.handlePrefix}${item.id}`;
    if (handles.has(handle)) throw new Error('Duplicate planned handle.');
    handles.add(handle);
    const variants = item.options.map((value) => {
      const sku = `${settings.skuPrefix}${skuSlug(item.id)}-${skuSlug(value)}`;
      if (skus.has(sku)) throw new Error('Duplicate planned SKU.');
      skus.add(sku);
      return {optionName: settings.optionNames[item.id], value, sku,
        illustrativePrice: (item.price / 100).toFixed(2)};
    });
    return {
      fixtureId: item.id,
      title: item.name,
      handle,
      status: 'DRAFT',
      publication: 'none',
      currency: settings.currency,
      productType: item.kind,
      conceptCategory: item.category,
      summary: item.description,
      detail: item.detail,
      specs: item.specs,
      ownershipMarker: `${settings.markerPrefix}${item.id}`,
      tags: settings.tags,
      variants,
      image: {localName: item.image, bytes: statSync(imagePath).size, sha256: sha256(image)},
    };
  });
  if (ids.size !== expected.size || skus.size !== 12) throw new Error('Expected six products and twelve unique SKUs.');
  const payload = {mode: 'dry-run', remoteWrites: 0, sourceSha256: sha256(source),
    productCount: records.length, variantCount: skus.size, records};
  return {settings, report: {...payload, planSha256: sha256(JSON.stringify(payload)),
    settingsSha256: sha256(settingsSource)}};
}
