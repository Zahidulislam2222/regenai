import {data, useLoaderData} from 'react-router';
import {Analytics, getSelectedProductOptions} from '@shopify/hydrogen';
import {useState} from 'react';
import type {Route} from './+types/products.$handle';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {Gallery, type GalleryImage} from '~/components/pdp/Gallery';
import {VariantPicker, type VariantOption} from '~/components/pdp/VariantPicker';
import {AddToCartButton} from '~/components/pdp/AddToCartButton';
import {ClinicalProtocol} from '~/components/pdp/ClinicalProtocol';
import {ContraindicationCallout} from '~/components/pdp/ContraindicationCallout';
import {CertificationsBadges} from '~/components/pdp/CertificationsBadges';
import {StudyReferences} from '~/components/pdp/StudyReferences';
import {ProductFaq} from '~/components/pdp/ProductFaq';
import {ReviewsSkeleton} from '~/components/pdp/ReviewsSkeleton';
import {RelatedAndRecent} from '~/components/pdp/RelatedAndRecent';
import {
  JsonLd,
  breadcrumbSchema,
  productSchema,
  medicalWebPageSchema,
} from '~/lib/seo/jsonld';

export const meta = ({data}: Route.MetaArgs) => {
  if (!data?.product) return [{title: 'Product — RegenAI'}];
  const p = data.product;
  return [
    {title: `${p.title} — RegenAI`},
    {name: 'description', content: p.description ?? ''},
    {property: 'og:title', content: p.title},
    {property: 'og:type', content: 'product'},
    {property: 'og:description', content: p.description ?? ''},
    {property: 'og:image', content: p.featuredImage?.url ?? ''},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

export async function loader({params, request, context}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Product handle required', {status: 400});

  const selectedOptions = getSelectedProductOptions(request);

  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions},
  });

  if (!product) {
    throw new Response(`Product "${handle}" not found`, {status: 404});
  }

  return data({product});
}

export default function ProductRoute() {
  const {product} = useLoaderData<typeof loader>();
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    product.options.forEach((opt: any) => {
      const active = opt.optionValues.find((v: any) => v.name);
      if (active) init[opt.name] = active.name;
    });
    return init;
  });

  const selectedVariant =
    product.variants.nodes.find((v: any) =>
      v.selectedOptions.every((so: any) => selectedValues[so.name] === so.value),
    ) ?? product.variants.nodes[0];

  const images: GalleryImage[] = product.images.nodes.map((img: any) => ({
    src: img.url,
    alt: img.altText ?? product.title,
  }));

  const variantOptions: VariantOption[] = product.options.map((opt: any) => ({
    id: opt.name,
    name: opt.name,
    values: opt.optionValues.map((v: any) => ({
      value: v.name,
      available: true,
      selected: selectedValues[opt.name] === v.name,
    })),
  }));

  const priceDisplay = selectedVariant
    ? formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)
    : '—';
  const compareAt = selectedVariant?.compareAtPrice
    ? formatMoney(
        selectedVariant.compareAtPrice.amount,
        selectedVariant.compareAtPrice.currencyCode,
      )
    : null;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          {name: 'Home', url: 'https://regenai.com'},
          {name: 'Shop', url: 'https://regenai.com/collections'},
          {
            name: product.title,
            url: `https://regenai.com/products/${product.handle}`,
          },
        ])}
      />
      <JsonLd
        data={productSchema({
          name: product.title,
          description: product.description ?? '',
          sku: selectedVariant?.sku ?? product.id,
          image:
            product.images.nodes.length > 0
              ? product.images.nodes.map((i: any) => i.url)
              : product.featuredImage?.url ?? '',
          url: `https://regenai.com/products/${product.handle}`,
          price: selectedVariant?.price.amount ?? '0',
          priceCurrency: selectedVariant?.price.currencyCode ?? 'USD',
          availability: selectedVariant?.availableForSale ? 'InStock' : 'OutOfStock',
        })}
      />
      <JsonLd
        data={medicalWebPageSchema({
          name: product.title,
          description: product.description ?? '',
          url: `https://regenai.com/products/${product.handle}`,
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            {name: 'Home', href: '/'},
            {name: 'Shop', href: '/collections'},
            {name: product.title, href: `/products/${product.handle}`},
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <section aria-label="Product images">
            <Gallery images={images} />
          </section>

          <section aria-labelledby="product-heading" className="space-y-6">
            <header>
              <h1
                id="product-heading"
                className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl"
              >
                {product.title}
              </h1>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-[var(--text-primary)]">
                  {priceDisplay}
                </span>
                {compareAt ? (
                  <span className="text-lg text-[var(--text-subtle)] line-through">
                    {compareAt}
                  </span>
                ) : null}
              </div>
              <ReviewsSkeleton ratingValue={4.8} reviewCount={0} />
            </header>

            {product.descriptionHtml ? (
              <div
                className="prose prose-sm text-[var(--text-secondary)]"
                dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
              />
            ) : null}

            <VariantPicker
              options={variantOptions}
              onSelect={(optionName, value) =>
                setSelectedValues((prev) => ({...prev, [optionName]: value}))
              }
            />

            <AddToCartButton
              variantId={selectedVariant?.id ?? ''}
              disabled={!selectedVariant?.availableForSale}
              disabledReason={!selectedVariant?.availableForSale ? 'Out of stock' : undefined}
            />

            <CertificationsBadges items={[]} />
            <ContraindicationCallout items={[]} />
          </section>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            <ClinicalProtocol name="" description="" steps={[]} />
            <StudyReferences items={[]} />
            <ProductFaq items={[]} />
          </div>
        </div>

        <RelatedAndRecent related={[]} currentHandle={product.handle} />
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount ?? '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id ?? '',
              variantTitle: selectedVariant?.title ?? '',
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

function formatMoney(amount: string, currency: string) {
  const n = Number(amount);
  return new Intl.NumberFormat('en-US', {style: 'currency', currency}).format(n);
}

const PRODUCT_QUERY = `#graphql
  query Product(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      description
      descriptionHtml
      featuredImage { url altText }
      images(first: 10) {
        nodes { url altText }
      }
      options {
        name
        optionValues { name }
      }
      selectedOrFirstAvailableVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        id
        sku
        title
        availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        selectedOptions { name value }
      }
      variants(first: 100) {
        nodes {
          id
          sku
          title
          availableForSale
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          selectedOptions { name value }
        }
      }
    }
  }
` as const;
