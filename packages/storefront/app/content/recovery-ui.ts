import copy from './recovery-ui.json';
if (
  Object.values(copy).some(
    (value) => typeof value !== 'string' || !value.trim(),
  )
) {
  throw new Error('Invalid storefront interface copy');
}
export const ui = copy;
