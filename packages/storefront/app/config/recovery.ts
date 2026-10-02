/** Single boundary for preview behavior; no provider or private env is imported. */
export const recoverySettings = {
  mode: 'local-demo',
  currency: 'USD',
  locale: 'en-US',
  storageKey: 'regenai:demo-bag:v1',
  maxQuantity: 9,
  maxCartLines: 30,
  scene: {
    model: '/media/pulse.glb',
    poster: '/media/pulse.png',
    camera: [3.2, 1.5, 5.7] as const,
    fieldOfView: 33,
    maxPixelRatio: 1.6,
    background: 0xf2f1eb,
    rotation: {base: -0.3, scroll: 0.9, pointer: 0.2},
    floatAmplitude: 0.055,
    floatSpeed: 0.7,
  },
} as const;
export const money = (cents: number) =>
  new Intl.NumberFormat(recoverySettings.locale, {
    style: 'currency',
    currency: recoverySettings.currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
