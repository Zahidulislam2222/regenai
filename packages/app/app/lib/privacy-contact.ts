/** Shop-bound encryption for the email-only Shopify privacy payload variant. */
const context = (shop: string) => new TextEncoder().encode(`privacy-email:${shop}`);

async function keyFromBase64(base64Key: string, usage: KeyUsage[]): Promise<CryptoKey> {
  const bytes = Uint8Array.from(atob(base64Key), (char) => char.charCodeAt(0));
  if (bytes.length !== 32) throw new Error('Invalid privacy encryption key');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, usage);
}

export async function encryptPrivacyEmail(email: string, shop: string, base64Key: string): Promise<string> {
  const key = await keyFromBase64(base64Key, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    {name: 'AES-GCM', iv, additionalData: context(shop)}, key, new TextEncoder().encode(email),
  ));
  return `v1.${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...ciphertext))}`;
}

export async function decryptPrivacyEmail(ciphertext: string, shop: string, base64Key: string): Promise<string> {
  const parts = ciphertext.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') throw new Error('Invalid privacy contact');
  const iv = Uint8Array.from(atob(parts[1]), (char) => char.charCodeAt(0));
  const bytes = Uint8Array.from(atob(parts[2]), (char) => char.charCodeAt(0));
  if (iv.length !== 12 || bytes.length < 16) throw new Error('Invalid privacy contact');
  const key = await keyFromBase64(base64Key, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt(
    {name: 'AES-GCM', iv, additionalData: context(shop)}, key, bytes,
  );
  return new TextDecoder('utf-8', {fatal: true}).decode(plaintext);
}
