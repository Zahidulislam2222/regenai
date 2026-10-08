/**
 * JSON-LD schema builders. Each fn returns a `<script type="application/ld+json">`-safe
 * object; caller renders via `<script dangerouslySetInnerHTML={{__html: JSON.stringify(obj)}} />`.
 * React Router meta() doesn't emit script tags, so schemas live in the route component body.
 */

export type OrganizationSchemaInput = {
  name: string;
  url: string;
  description?: string;
  logo?: {url: string; width?: number; height?: number};
  sameAs?: string[];
  contactPoints?: Array<{contactType: string; email: string; availableLanguage?: string[]}>;
};

export function organizationSchema(input: OrganizationSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url: input.url,
    ...(input.description ? {description: input.description} : {}),
    ...(input.logo ? {logo: {'@type': 'ImageObject', ...input.logo}} : {}),
    ...(input.sameAs?.length ? {sameAs: input.sameAs} : {}),
    ...(input.contactPoints?.length ? {contactPoint: input.contactPoints.map((point) => ({
      '@type': 'ContactPoint', contactType: point.contactType, email: point.email,
      ...(point.availableLanguage?.length ? {availableLanguage: point.availableLanguage} : {}),
    }))} : {}),
  };
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
  offer?: {
    price: string;
    priceCurrency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder';
    url: string;
  };
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
  };
  if (p.brand) base.brand = {'@type': 'Brand', name: p.brand};
  if (p.offer) base.offers = {
    '@type': 'Offer',
    price: p.offer.price,
    priceCurrency: p.offer.priceCurrency,
    availability: `https://schema.org/${p.offer.availability}`,
    url: p.offer.url,
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
      dangerouslySetInnerHTML={{__html: JSON.stringify(data).replace(/</g, '\\u003c')}}
    />
  );
}
