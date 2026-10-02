import rawCatalog from './recovery-catalog.json';
export interface RecoveryProduct {
  id: string;
  name: string;
  kind: string;
  category: string;
  price: number;
  image: string;
  color: string;
  options: string[];
  areas: string[];
  description: string;
  detail: string;
  specs: string[][];
}
export function validateCatalog(input: unknown): RecoveryProduct[] {
  if (!Array.isArray(input)) throw new Error('Catalog must be an array');
  const ids = new Set<string>();
  return input.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('Invalid product');
    const p = value as RecoveryProduct;
    if (
      !/^[a-z0-9-]+$/.test(p.id) ||
      ids.has(p.id) ||
      !p.name ||
      !p.kind ||
      !p.description ||
      !p.detail ||
      !Number.isSafeInteger(p.price) ||
      p.price <= 0 ||
      !/^\/media\/[a-z0-9.-]+$/.test(p.image) ||
      !Array.isArray(p.options) ||
      !p.options.length ||
      p.options.some((o) => typeof o !== 'string' || !o) ||
      new Set(p.options).size !== p.options.length ||
      !Array.isArray(p.areas) ||
      !Array.isArray(p.specs)
    )
      throw new Error('Invalid catalog entry');
    ids.add(p.id);
    return p;
  });
}
export const products = validateCatalog(rawCatalog);
export const site = {
  name: 'regenai',
  demo: 'Explore recovery objects and the thinking behind their design.',
  errors: {
    notFound: {
      eyebrow: 'A MOMENT OFF TRACK',
      title: 'This page is not part of the collection.',
      body: 'The address may have changed, or the page may not exist in this collection.',
    },
    unavailable: {
      eyebrow: 'A TEMPORARY PAUSE',
      title: 'This page is temporarily unavailable.',
      body: 'Please try again in a little while, or return to the collection.',
    },
  },
  nav: [
    {label: 'The collection', to: '/collections/all'},
    {label: 'Our approach', to: '/about'},
    {label: 'Recovery finder', to: '/quiz'},
    {label: 'Design notes', to: '/journal'},
  ],
  hero: {
    eyebrow: 'RECOVERY, WITH INTENTION.',
    lines: ['Make room', 'for recovery.'],
    body: 'For the pause after the push. Thoughtfully designed tools to make looking after yourself part of every day.',
    primary: 'Explore the collection',
    secondary: 'Find your recovery ritual',
  },
  categories: ['All tools', 'Release', 'Move', 'Reset'],
  areas: ['Back', 'Shoulders', 'Legs', 'Hips'],
  bodyPoints: [
    {label: 'Shoulders', x: 138, y: 136},
    {label: 'Back', x: 180, y: 195},
    {label: 'Hips', x: 180, y: 263},
    {label: 'Legs', x: 157, y: 349},
  ],
  home: {
    collectionTitle: 'Good tools. Better rituals.',
    collectionBody:
      'A considered collection for the way you move, unwind, and begin again.',
    approachTitle: 'Recovery isn’t a reward.\nIt’s part of the rhythm.',
    approachBody:
      'An early start. A long stretch at your desk. One more mile. Whatever your day asks of you, make a little space to give something back.',
    labTitle: 'A quieter kind\nof progress.',
    labBody:
      'Less noise. More intention. Step inside the world behind the collection.',
  },
  inspection: [
    {
      number: '01',
      title: 'Meet your contact point.',
      body: 'A rounded attachment and a considered silhouette. Every detail starts with how a tool meets your everyday routine.',
      label: 'ROUND CONTACT HEAD',
    },
    {
      number: '02',
      title: 'A grip that feels considered.',
      body: 'A sculpted handle. Tactile ribbing. Details you can see, turn, and explore before you choose.',
      label: 'TEXTURED GRIP',
    },
    {
      number: '03',
      title: 'Find your own rhythm.',
      body: 'A form study for the wind-down corner. Explore the design details as the product is developed.',
      label: 'PULSE ONE / DESIGN 01',
    },
  ],
  finder: {
    title: 'Start with you.',
    intro: 'Three small questions. A collection that fits your day.',
    steps: [
      {
        title: 'Where do you want to focus?',
        hint: 'Choose an area to explore. This is a shopping guide, not a medical assessment.',
        options: ['Back', 'Shoulders', 'Legs', 'Hips'],
      },
      {
        title: 'What does your day look like?',
        hint: 'Choose the rhythm that feels closest to yours.',
        options: ['At a desk', 'On the move', 'In training'],
      },
      {
        title: 'What would you like more of?',
        hint: 'We’ll match your preference with the design collection.',
        options: ['Release', 'Move', 'Reset'],
      },
    ],
    resultTitle: 'Your space to recover.',
    disclaimer:
      'These are rule-based matches among design studies, not AI inference, a diagnosis or a treatment recommendation. Your answers stay in this page and are not saved or sent.',
  },
  footer: {
    line: 'A little space.\nA better everyday.',
    note: 'Original recovery-object design studies. Ordering opens when product details and availability are confirmed.',
    links: [
      {label: 'Our approach', to: '/about'},
      {label: 'Evidence & transparency', to: '/evidence'},
      {label: 'Privacy', to: '/policies/privacy'},
      {label: 'Delivery & returns', to: '/policies/delivery'},
    ],
  },
  pages: {
    about: {
      eyebrow: 'OUR APPROACH',
      title: 'More intention.\nLess noise.',
      body: 'RegenAI explores how thoughtfully designed recovery objects could fit into everyday life. The collection is in development.',
      sections: [
        [
          'Designed around the everyday',
          'The collection brings together original industrial-design studies, a clear product finder, and a calm place to explore the forms.',
        ],
        [
          'Objects you can explore',
          'The Pulse One form was modeled in Blender and can be explored interactively in your browser. The render shows a design direction; physical specifications are not yet confirmed.',
        ],
        [
          'A work in progress, openly',
          'Product specifications, inventory and fulfillment are being confirmed. Ordering remains closed until those details are available.',
        ],
      ],
    },
    evidence: {
      eyebrow: 'EVIDENCE & TRANSPARENCY',
      title: 'Clarity comes first.',
      body: 'Good design is no substitute for evidence. Here is what has and has not been established.',
      sections: [
        [
          'Original design studies, without medical claims',
          'The current visuals represent original design studies. Physical specifications and performance have not been verified. We make no medical-device, clinical, review or health-outcome claims.',
        ],
        [
          'How the finder works',
          'It filters the local catalog by your selected body area and product category. It does not assess symptoms or provide medical advice.',
        ],
        [
          'Before a real launch',
          'Physical product validation, appropriate safety documentation, evidence review, approved policies and confirmed merchandise are required before ordering can open.',
        ],
      ],
    },
    privacy: {
      eyebrow: 'PRIVACY',
      title: 'Your pause is yours.',
      body: 'Finder answers stay in the current browser session. They are not submitted or used to build a profile.',
      sections: [
        [
          'What stays on this device',
          'This page does not require an account to explore the collection.',
        ],
        [
          'What is not stored',
          'Finder answers stay in component memory for the current visit. They are not added to URLs, stored, or transmitted.',
        ],
        [
          'A future live service',
          'Before orders or accounts open, an owner-approved privacy policy and appropriate consent controls will be published.',
        ],
      ],
    },
    delivery: {
      eyebrow: 'DELIVERY & RETURNS',
      title: 'Explore freely.',
      body: 'Ordering is not open while products and fulfillment are being confirmed.',
      sections: [
        [
          'Prices and availability',
          'Prices and availability will be published when merchandise is ready to order.',
        ],
        [
          'No purchase is made',
          'There is no payment form or order placement on these product pages.',
        ],
        [
          'Before products go on sale',
          'Real availability, delivery regions, costs, returns terms, warranty and product documentation must be supplied and verified.',
        ],
      ],
    },
  },
};
export const media = {
  lab: {
    image: '/media/lab.webp',
    video: '/media/lab.mp4',
    videoAvailable: false,
    alt: 'Sculptural recovery studio with a blue bench, warm plaster and circular sea-facing window',
    kind: 'AI-generated architectural concept',
  },
  productKind: 'Original Blender product concept',
};
