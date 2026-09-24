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
  demo: 'A recovery collection, imagined. Explore the local concept store.',
  errors: {
    notFound: {
      eyebrow: 'A MOMENT OFF TRACK',
      title: 'This page is not part of the collection.',
      body: 'The address may have changed, or the page may not exist in this concept store.',
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
      body: 'One simple addition to your wind-down corner. Explore the concept, then build a collection around you.',
      label: 'PULSE ONE / CONCEPT 01',
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
        hint: 'We’ll match your preference with the concept collection.',
        options: ['Release', 'Move', 'Reset'],
      },
    ],
    resultTitle: 'Your space to recover.',
    disclaimer:
      'These are rule-based product matches from a fictional catalog, not AI inference, a diagnosis or a treatment recommendation. Your answers stay in this page and are not saved or sent.',
  },
  footer: {
    line: 'A little space.\nA better everyday.',
    note: 'An independent recovery-commerce concept. Original product designs and example prices; no products are for sale.',
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
      body: 'RegenAI is an independent concept exploring how recovery tools could fit into everyday life. We believe thoughtful objects deserve a thoughtful shopping experience.',
      sections: [
        [
          'Designed around the everyday',
          'The collection brings together original industrial-design concepts, a clear product finder, and a calm place to compare your options.',
        ],
        [
          'Objects you can explore',
          'The Pulse One is modeled in Blender and rendered interactively in your browser. These models illustrate a design direction, not manufactured or clinically tested devices.',
        ],
        [
          'A work in progress, openly',
          'This local frontend demonstrates shopping interactions. Product fulfillment, real checkout, device connectivity and clinical review are not active.',
        ],
      ],
    },
    evidence: {
      eyebrow: 'EVIDENCE & TRANSPARENCY',
      title: 'Clarity comes first.',
      body: 'Good design is no substitute for evidence. Here is exactly what this concept does—and what has not been established.',
      sections: [
        [
          'Original concepts, not medical devices',
          'Products, specifications and prices are fictional demonstration content. There are no FDA-clearance claims, clinical endorsements, verified reviews or promised health outcomes.',
        ],
        [
          'How the finder works',
          'It filters the local catalog by your selected body area and product category. It does not assess symptoms or provide medical advice.',
        ],
        [
          'Before a real launch',
          'Physical product validation, appropriate safety documentation, independent evidence review, approved policies and a working commerce integration would be required.',
        ],
      ],
    },
    privacy: {
      eyebrow: 'PRIVACY / LOCAL DEMO',
      title: 'Your pause is yours.',
      body: 'This frontend runs as a local demonstration. It does not submit your finder answers or send analytics events.',
      sections: [
        [
          'What stays on this device',
          'Your demo bag stores product identifiers, options and quantities in browser localStorage. Removing all bag items clears the contents.',
        ],
        [
          'What is not stored',
          'Finder answers stay in component memory for the current visit. They are not added to URLs, stored, or transmitted.',
        ],
        [
          'A future live service',
          'A production service will need an owner-approved privacy policy and consent controls before collecting account, order or health-related information.',
        ],
      ],
    },
    delivery: {
      eyebrow: 'DELIVERY & RETURNS / LOCAL DEMO',
      title: 'Explore freely.',
      body: 'No orders, payments, shipping or returns are processed in this concept store.',
      sections: [
        [
          'Example prices',
          'All displayed USD prices are demo values. The bag calculates a sample subtotal only; taxes and shipping are not quoted.',
        ],
        [
          'No purchase is made',
          'The preview checkout explains this boundary. It does not collect payment details or create an order.',
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
