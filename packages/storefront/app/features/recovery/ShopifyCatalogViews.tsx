import {useState} from 'react';
import {Link, useSearchParams} from 'react-router';
import {ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Plus, Search, SlidersHorizontal} from 'lucide-react';
import {CartForm} from '@shopify/hydrogen';
import {getDesignCategoryHandle, site} from '~/content/recovery';
import {ui} from '~/content/recovery-ui';
import {editorial} from '~/content/recovery-editorial';
import {CategoryExplore, HomeQuestions, JournalFeature} from './Editorial';
import type {ConceptEditorial} from '~/lib/concept-editorial.server';
import type {CatalogVariant, ShopifyCatalogProduct} from '~/lib/shopify-catalog.server';
import {Inspection, LabFilm, ProductVisual} from './Experience';
import {Mark} from './RecoveryShell';

function money(variant: CatalogVariant | undefined): string | null {
  if (!variant?.price) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: variant.price.currencyCode,
    }).format(Number(variant.price.amount));
  } catch {
    return null;
  }
}

function status(product: ShopifyCatalogProduct): string {
  if (!product.complete) return 'Details unavailable';
  return product.availableForSale && product.variants.some((variant) => variant.availableForSale)
    ? 'Sandbox concept' : 'Unavailable';
}

function ProductCard({product, index, comparison}: {product: ShopifyCatalogProduct; index: number;
  comparison?: {selected: boolean; disabled: boolean; toggle: () => void}}) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.handle}`} className="product-card-image" aria-label={`Explore ${product.name}`}>
        <span className="card-category">{product.kind || 'Recovery object'}</span>
        <span className="card-index">0{index + 1}</span>
        {product.image ? (
          <img src={product.image.url} alt={product.image.altText || `${product.name} concept render`}
            loading="lazy" width={product.image.width ?? 1000} height={product.image.height ?? 1000} />
        ) : <span className="empty-state">Image unavailable</span>}
      </Link>
      <div className="product-card-info">
        <div>
          <Link to={`/products/${product.handle}`}><h3>{product.name}</h3></Link>
          <p>{product.kind || 'Design study'}</p>
        </div>
        <span className="product-status">{status(product)}</span>
      </div>
      {comparison && <button className="product-compare-button" type="button"
        aria-pressed={comparison.selected} disabled={comparison.disabled} onClick={comparison.toggle}>
        {comparison.selected ? editorial.ui.shopifyCompareRemove : editorial.ui.shopifyCompareSelect}
      </button>}
    </article>
  );
}

function ShopifyComparison({products, concepts, remove, sandboxCartEnabled}: {
  products: ShopifyCatalogProduct[];
  concepts: Record<string, ConceptEditorial | null>;
  remove: (id: string) => void;
  sandboxCartEnabled: boolean;
}) {
  if (!products.length) return null;
  const unknown = editorial.ui.shopifyCompareUnknown;
  const specs = [...new Set(products.flatMap((product) => concepts[product.id]?.specs.map(({label}) => label) ?? []))];
  const rows = [
    {label: editorial.ui.shopifyCompareCategory, value: (product: ShopifyCatalogProduct) => concepts[product.id]?.category ?? unknown},
    {label: editorial.ui.shopifyCompareType, value: (product: ShopifyCatalogProduct) => product.kind || unknown},
    {label: editorial.ui.shopifyCompareOptions, value: (product: ShopifyCatalogProduct) =>
      product.options.map(({name, values}) => `${name}: ${values.join(', ')}`).join(' · ') || unknown},
    {label: editorial.ui.shopifyComparePrice, value: (product: ShopifyCatalogProduct) =>
      product.complete ? money(product.variants[0]) ?? unknown : unknown},
    {label: editorial.ui.shopifyCompareAvailability, value: (product: ShopifyCatalogProduct) =>
      product.complete && product.availableForSale && product.variants.some((variant) => variant.availableForSale)
        ? sandboxCartEnabled ? editorial.ui.shopifySandboxCompareAvailable : editorial.ui.shopifyCompareAvailable
        : editorial.ui.shopifyCompareUnavailable},
    ...specs.map((label) => ({label, value: (product: ShopifyCatalogProduct) =>
      concepts[product.id]?.specs.find((spec) => spec.label === label)?.value ?? unknown})),
  ];
  return <section className="shopify-comparison" aria-labelledby="shopify-comparison-title">
    <div className="section-heading"><div><p className="eyebrow">{editorial.ui.shopifyCompareEyebrow}</p>
      <h2 id="shopify-comparison-title">{editorial.ui.shopifyCompareTitle}</h2></div></div>
    <p>{sandboxCartEnabled ? editorial.ui.shopifySandboxCompareDisclosure : editorial.ui.shopifyCompareDisclosure}</p>
    {products.length < 2 ? <p role="status">{editorial.ui.shopifyComparePrompt}</p> : null}
    <p className="shopify-comparison-scroll-hint">{editorial.ui.shopifyCompareScrollHint}</p>
    <div className="shopify-comparison-scroll">
      <table>
        <thead><tr><th scope="col">{editorial.ui.shopifyCompareDetail}</th>{products.map((product) =>
          <th scope="col" key={product.id}>
            {product.image && <img src={product.image.url} alt="" loading="lazy" width={100} height={100} />}
            <strong>{product.name}</strong>
            <Link to={`/products/${product.handle}`}>{editorial.ui.shopifyCompareView}</Link>
            <button type="button" onClick={() => remove(product.id)}
              aria-label={`${editorial.ui.shopifyCompareRemove}: ${product.name}`}>{editorial.ui.shopifyCompareRemove}</button>
          </th>)}</tr></thead>
        <tbody>{rows.map(({label, value}) => <tr key={label}><th scope="row">{label}</th>
          {products.map((product) => <td key={product.id}>{value(product)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

export function ShopifyHomeView({products, sceneProduct, paused}: {
  products: ShopifyCatalogProduct[];
  sceneProduct: ShopifyCatalogProduct | null;
  paused: boolean;
}) {
  const featured = products.slice(0, 3);
  const heroProduct = sceneProduct ?? featured[0];
  return (
    <>
      <section className="hero">
        <div className="hero-grain" />
        <div className="hero-topline"><span><i className="status-dot" /> {site.hero.eyebrow}</span>
          <span>{ui.collection_001_everyday_tools_5e408a}</span></div>
        <div className="hero-copy">
          <h1>{site.hero.lines[0]}<br /><span>{site.hero.lines[1]}</span></h1>
          <p>{site.hero.body}</p>
          <Link className="button" to="/collections/all">{site.hero.primary} <ArrowUpRight size={19} /></Link>
          <Link className="hero-secondary" to="/quiz">{site.hero.secondary} <ArrowRight size={16} /></Link>
        </div>
        <div className="hero-object">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="object-cross cross-a">{ui._a318c2}</span>
          <span className="object-cross cross-b">{ui._a318c2}</span>
          {sceneProduct ? <ProductVisual paused={paused} poster={sceneProduct.image?.url} posterPriority /> : heroProduct?.image ? <img src={heroProduct.image.url}
            alt={heroProduct.image.altText || `${heroProduct.name} concept render`}
            loading="eager" {...{fetchpriority: 'high'}}
            width={heroProduct.image.width ?? 1000} height={heroProduct.image.height ?? 1000} />
            : <p className="empty-state">The Shopify concept collection is being prepared.</p>}
          <div className="object-shadow" />
          {heroProduct && <Link className="hero-product-label" to={`/products/${heroProduct.handle}`}>
            <span><small>{ui.meet_your_everyday_essential_bc05c1}</small>
              <strong>{heroProduct.name}<span>{ui._ca29ed}</span></strong></span>
            <span className="product-index">01 — {String(products.length).padStart(2, '0')}</span>
          </Link>}
        </div>
        <div className="hero-bottom"><a href="#collection" className="scroll-cue">
          <ArrowDown size={15} />{ui.scroll_to_find_your_rhythm_962ea0}</a>
          <span>{ui.designed_with_intention_built_as_a_concept_1aeeef}</span></div>
      </section>
      <div className="principle-strip"><span>{ui.recovery_is_personal_011ec7}</span>
        <span><span className="mini-star">{ui._20baed}</span>{ui.make_it_part_of_your_everyday_6bbdf7}</span>
        <Link to="/evidence">{ui.clarity_before_claims_234298}<ArrowUpRight size={16} /></Link>
      </div>
      <section className="section collection-section" id="collection">
        <div className="section-heading"><div><p className="eyebrow">THE EVERYDAY COLLECTION</p><h2>{site.home.collectionTitle}</h2></div>
          <Link className="text-link" to="/collections/all">Explore all tools <ArrowUpRight size={19} /></Link></div>
        {featured.length ? <div className="product-grid featured-grid">{featured.map((product, index) =>
          <ProductCard key={product.id} product={product} index={index} />)}</div>
          : <div className="empty-state"><h3>Collection coming into view</h3><p>No RegenAI concepts are published to this storefront yet.</p></div>}
      </section>
      <CategoryExplore catalogMode="shopify" />
      {sceneProduct && <Inspection paused={paused} productHref={`/products/${sceneProduct.handle}`}
        poster={sceneProduct.image?.url} />}
      <section className="section ritual-section">
        <div className="ritual-index"><Mark /><p className="eyebrow">OUR APPROACH</p></div>
        <h2>{site.home.approachTitle}</h2>
        <div className="ritual-bottom"><p>{site.home.approachBody}</p>
          <Link className="button button-outline" to="/about">Explore our approach <ArrowUpRight size={18} /></Link></div>
      </section>
      <LabFilm paused={paused} />
      <JournalFeature />
      <section className="finder-invitation section shopify-finder-invitation">
        <div><p className="eyebrow">{editorial.ui.shopifyFinderInviteEyebrow}</p>
          <h2>{editorial.ui.shopifyFinderInviteTitle}</h2>
          <p>{editorial.ui.shopifyFinderInviteBody}</p>
          <Link className="button" to="/quiz">{editorial.ui.shopifyFinderInviteAction} <ArrowUpRight size={18} /></Link>
        </div>
      </section>
      <HomeQuestions />
    </>
  );
}

export function ShopifyCatalogView({products, concepts = {}, search = false, categoryTitle,
  sandboxCartEnabled = false}: {
  products: ShopifyCatalogProduct[];
  concepts?: Record<string, ConceptEditorial | null>;
  search?: boolean;
  categoryTitle?: string;
  sandboxCartEnabled?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedProducts = selectedIds.map((id) => products.find((product) => product.id === id))
    .filter((product): product is ShopifyCatalogProduct => Boolean(product));
  const toggleComparison = (id: string) => setSelectedIds((current) => current.includes(id)
    ? current.filter((selected) => selected !== id)
    : current.length < editorial.comparisonLimit ? [...current, id] : current);
  const query = (params.get('q') ?? '').trim().toLowerCase();
  const category = params.get('category') ?? 'All tools';
  const sort = params.get('sort') ?? 'featured';
  const categories = ['All tools', ...new Set(products.map((product) => product.kind).filter(Boolean))];
  const filtered = products.filter((product) =>
    (category === 'All tools' || product.kind === category) &&
    `${product.name} ${product.kind} ${product.description}`.toLowerCase().includes(query));
  if (sort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'price-asc' || sort === 'price-desc') filtered.sort((a, b) => {
    const left = a.variants[0]?.price ? Number(a.variants[0].price.amount) : null;
    const right = b.variants[0]?.price ? Number(b.variants[0].price.amount) : null;
    if (left === null) return 1;
    if (right === null) return -1;
    return sort === 'price-asc' ? left - right : right - left;
  });
  const update = (key: string, value: string) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value); else next.delete(key);
    return next;
  }, {replace: true, preventScrollReset: true});
  return (
    <section className="page catalog-page">
      <p className="eyebrow">{categoryTitle ? site.designCategory.eyebrow : 'THE EVERYDAY COLLECTION'} / SHOPIFY SANDBOX</p>
      <div className="catalog-heading"><h1>{categoryTitle ? `${categoryTitle} ${site.designCategory.titleSuffix}` : search ? 'Find your next ritual.' : 'Room for recovery.'}</h1>
        <p>{sandboxCartEnabled ? editorial.ui.shopifySandboxCollectionNotice
          : 'Original design studies. Ordering is closed while the sandbox is being verified.'}</p></div>
      <nav className="catalog-design-nav" aria-label={site.designCategory.navLabel}>
        <Link to="/collections/all" aria-current={!categoryTitle ? 'page' : undefined}>All tools</Link>
        {site.categories.slice(1).map((name) => <Link key={name} to={`/collections/${getDesignCategoryHandle(name)}`}
          aria-current={categoryTitle === name ? 'page' : undefined}>{name}</Link>)}
      </nav>
      <div className="catalog-toolbar">
        <div className="category-tabs" aria-label="Product categories">{categories.map((item) =>
          <button key={item} aria-pressed={category === item} onClick={() => update('category', item === 'All tools' ? '' : item)}>{item}</button>)}</div>
        <label className="search-input"><Search size={18} /><span className="sr-only">Search products</span>
          <input type="search" placeholder="Find a tool" value={params.get('q') ?? ''} onChange={(event) => update('q', event.target.value)} /></label>
        <label className="sort-select"><SlidersHorizontal size={16} /><span className="sr-only">Sort products</span>
          <select value={['name-asc', 'price-asc', 'price-desc'].includes(sort) ? sort : 'featured'} onChange={(event) => update('sort', event.target.value)}>
            <option value="featured">Featured</option><option value="name-asc">Name: A to Z</option>
            <option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
          </select></label>
      </div>
      <div className="results-summary"><span role="status">{filtered.length} {filtered.length === 1 ? 'tool' : 'tools'} to explore</span>
        <span>{sandboxCartEnabled ? editorial.ui.shopifySandboxCollectionStatus
          : 'DESIGN STUDIES / ORDERING NOT OPEN'}</span></div>
      <ShopifyComparison products={selectedProducts} concepts={concepts} remove={toggleComparison}
        sandboxCartEnabled={sandboxCartEnabled} />
      {filtered.length ? <div className="product-grid">{filtered.map((product, index) =>
        <ProductCard key={product.id} product={product} index={index} comparison={{
          selected: selectedIds.includes(product.id),
          disabled: selectedIds.length >= editorial.comparisonLimit && !selectedIds.includes(product.id),
          toggle: () => toggleComparison(product.id),
        }} />)}</div>
        : <div className="empty-state"><h2>No concepts found</h2><p>{products.length ? 'Try another search or clear the filters.' : categoryTitle ? site.designCategory.emptyBody : 'No RegenAI concepts are published to this storefront yet.'}</p>
          {products.length > 0 && <button className="button" onClick={() => setParams({})}>Show the collection <ArrowUpRight size={18} /></button>}</div>}
    </section>
  );
}

export function ShopifyFinderView({products}: {products: ShopifyCatalogProduct[]}) {
  const [focus, setFocus] = useState('All tools');
  const types = ['All tools', ...new Set(products.map((product) => product.kind).filter(Boolean))];
  const matches = focus === 'All tools' ? products : products.filter((product) => product.kind === focus);
  return (
    <section className="page finder-page">
      <div className="finder-top"><div><p className="eyebrow">THE RECOVERY FINDER / SHOPIFY SANDBOX</p>
        <h1>Find your starting point.</h1>
        <p>Explore published concepts by their Shopify product type. The current collection has no validated body area recommendations.</p>
      </div></div>
      <div className="category-tabs" aria-label="Product focus">{types.map((type) =>
        <button key={type} aria-pressed={focus === type} onClick={() => setFocus(type)}>{type}</button>)}</div>
      {matches.length ? <div className="product-grid">{matches.map((product, index) =>
        <ProductCard key={product.id} product={product} index={index} />)}</div>
        : <div className="empty-state"><h2>No concepts available</h2><p>No RegenAI concepts are published to this storefront yet.</p></div>}
    </section>
  );
}

export function ShopifyProductView({product, concept, related, sandboxCartEnabled}: {
  product: ShopifyCatalogProduct;
  concept: ConceptEditorial | null;
  related: ShopifyCatalogProduct[];
  sandboxCartEnabled: boolean;
}) {
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const selected = product.variants.find((variant) => variant.id === selectedId);
  const displayPrice = product.complete ? money(selected) : null;
  const galleryImages = product.images.length ? product.images : product.image ? [product.image] : [];
  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0];
  return (
    <section className="page product-page">
      <Link to="/collections/all" className="back-link"><ArrowLeft size={16} />The collection</Link>
      <div className="product-layout">
        <div className="product-gallery shopify-product-gallery">
          <span className="eyebrow">{product.kind || 'RECOVERY OBJECT'} / CONCEPT COLLECTION</span>
          {activeImage ? <img src={activeImage.url} alt={activeImage.altText || `${product.name} concept render`}
            width={activeImage.width ?? 1000} height={activeImage.height ?? 1000} />
            : <p className="empty-state">Image unavailable</p>}
          {galleryImages.length > 1 && <div className="shopify-gallery-thumbs" role="group" aria-label="Product images">
            {galleryImages.map((image, index) => <button key={image.url} type="button"
              aria-label={`${editorial.ui.shopifyViewImage} ${index + 1} of ${galleryImages.length}`}
              aria-pressed={index === activeImageIndex} onClick={() => setActiveImageIndex(index)}>
              <img src={image.url} alt="" loading="lazy" width={image.width ?? 100} height={image.height ?? 100} />
            </button>)}
          </div>}
        </div>
        <div className="product-details">
          <p className="eyebrow">SHOPIFY SANDBOX CONCEPT</p><h1>{product.name}</h1>
          <p className="product-description">{concept?.summary ?? product.description}</p>
          {concept && <div className="shopify-concept-note">
            <h2>{editorial.ui.shopifyDesignNoteTitle}</h2>
            <p>{concept.detail}</p>
            <p>{concept.notice}</p>
          </div>}
          <p className="product-availability">{status(product)}.
            {sandboxCartEnabled ? ' Test orders only in the local development store.' : ' Ordering is closed during sandbox verification.'}</p>
          {product.variants.length > 1 && <label className="sort-select">Option
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.title}</option>)}
            </select></label>}
          <p>{selected?.selectedOptions.map((option) => `${option.name}: ${option.value}`).join(' · ')}</p>
          <p className="shopify-variant-price"><strong>{displayPrice ?? 'Price unavailable'}</strong>
            {displayPrice && <span>{editorial.ui.shopifyPriceLabel}</span>}
            {selected && !selected.availableForSale && <span>Unavailable</span>}
          </p>
          {sandboxCartEnabled && product.complete && selected?.availableForSale && selected.price &&
            <CartForm route="/cart" action={CartForm.ACTIONS.LinesAdd}
              inputs={{lines: [{merchandiseId: selected.id, quantity: 1}]}}>
              {(fetcher) => <button className="button full" type="submit" disabled={fetcher.state !== 'idle'}>
                {fetcher.state === 'idle' ? 'Add to sandbox cart' : 'Adding…'}
              </button>}
            </CartForm>}
          {sandboxCartEnabled && <Link className="shopify-view-cart-link" to="/cart">View sandbox cart</Link>}
          <Link className="button full" to="/evidence">Read the concept evidence <ArrowUpRight size={19} /></Link>
          <div className="product-accordions">
            {concept && <details open>
              <summary>{editorial.ui.shopifySpecsTitle}<Plus size={17} aria-hidden="true" /></summary>
              <p>{editorial.ui.shopifySpecsNotice}</p>
              <dl>{concept.specs.map(({label, value}) => <div key={label}>
                <dt>{label}</dt><dd>{value}</dd>
              </div>)}</dl>
            </details>}
            {editorial.productQuestions.map(({id, question, answer}) => <details key={id}>
              <summary>{question}<Plus size={17} aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>)}
          </div>
        </div>
      </div>
      {related.length > 0 && <>
        <div className="section-heading related-heading">
          <h2>{editorial.ui.shopifyRelatedTitle}</h2>
          <Link to="/collections/all" className="text-link">The collection <ArrowUpRight size={18} /></Link>
        </div>
        <div className="product-grid shopify-related-grid">{related.map((item, index) =>
          <ProductCard key={item.id} product={item} index={index} />)}</div>
      </>}
    </section>
  );
}
