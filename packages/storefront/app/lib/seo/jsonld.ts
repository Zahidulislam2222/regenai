/**
 * JSON-LD schema builders. Each fn returns a `<script type="application/ld+json">`-safe
 * object; caller renders via `<script dangerouslySetInnerHTML={{__html: JSON.stringify(obj)}} />`.
 * React Router meta() doesn't emit script tags, so schemas live in the route component body.
 */

const ORG = {
  '@type': 'Organization',
  '@id': 'https://regenai.com/#organization',
  name: 'RegenAI',
  url: 'https://regenai.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://regenai.com/logo.png',
    width: 512,
    height: 512,
  },
  description:
    'Science-backed recovery. AI-guided wellness. From injury to everyday resilience — products and protocols built with clinical input and real ML.',
  sameAs: [
    'https://instagram.com/regenai',
    'https://tiktok.com/@regenai',
    'https://www.linkedin.com/company/regenai',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hello@regenai.com',
      availableLanguage: ['en', 'es', 'fr', 'de', 'ar'],
    },
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'b2b@regenai.com',
      availableLanguage: ['en'],
    },
  ],
};

export function organizationSchema() {
  return {'@context': 'https://schema.org', ...ORG};
}

export function breadcrumbSchema(items: Array<{name: string; url: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((i, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: i.name,
      item: i.url,
    })),
  };
}

export interface ProductSchemaInput {
  name: string;
  description: string;
  sku: string;
  image: string | string[];
  url: string;
  brand?: string;
  price: string;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder';
  gtin?: string;
  ratingValue?: number;
  reviewCount?: number;
  medicalDeviceClass?: 'Class I' | 'Class II' | 'Class III';
}

export function productSchema(p: ProductSchemaInput) {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    sku: p.sku,
    image: p.image,
    url: p.url,
    brand: {'@type': 'Brand', name: p.brand ?? 'RegenAI'},
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: p.priceCurrency ?? 'USD',
      availability: `https://schema.org/${p.availability ?? 'InStock'}`,
      url: p.url,
    },
  };
  if (p.gtin) base.gtin = p.gtin;
  if (p.medicalDeviceClass) {
    // @type extension — MedicalDevice lives in schema.org/MedicalDevice
    (base['@type'] as unknown as string[]) = ['Product', 'MedicalDevice'];
    base.medicalDeviceClass = p.medicalDeviceClass;
  }
  if (p.ratingValue && p.reviewCount) {
    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: p.ratingValue,
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return base;
}

export function faqSchema(items: Array<{q: string; a: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: {'@type': 'Answer', text: i.a},
    })),
  };
}

export function howToSchema({
  name,
  description,
  totalTime,
  steps,
}: {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration
  steps: Array<{name: string; text: string; image?: string}>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(totalTime ? {totalTime} : {}),
    step: steps.map((s, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: s.name,
      text: s.text,
      ...(s.image ? {image: s.image} : {}),
    })),
  };
}

export function medicalWebPageSchema({
  name,
  description,
  url,
  lastReviewed,
  reviewedBy,
}: {
  name: string;
  description: string;
  url: string;
  lastReviewed?: string; // ISO date
  reviewedBy?: {name: string; credentials: string};
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name,
    description,
    url,
    ...(lastReviewed ? {lastReviewed} : {}),
    ...(reviewedBy
      ? {
          reviewedBy: {
            '@type': 'Person',
            name: reviewedBy.name,
            honorificSuffix: reviewedBy.credentials,
          },
        }
      : {}),
  };
}

/** Render helper — emit a JSON-LD <script> into JSX. */
export function JsonLd({data}: {data: unknown}) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{__html: JSON.stringify(data)}}
    />
  );
}
