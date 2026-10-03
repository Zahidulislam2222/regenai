import {useState} from 'react';
import {Link, useSearchParams} from 'react-router';
import {ArrowLeft, ArrowUpRight, Plus, Search, SlidersHorizontal} from 'lucide-react';
import {CartForm} from '@shopify/hydrogen';
import {site} from '~/content/recovery';
import {editorial} from '~/content/recovery-editorial';
import type {ConceptEditorial} from '~/lib/concept-editorial.server';
import type {CatalogVariant, ShopifyCatalogProduct} from '~/lib/shopify-catalog.server';

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

function ProductCard({product, index}: {product: ShopifyCatalogProduct; index: number}) {
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
    </article>
  );
}

export function ShopifyHomeView({products}: {products: ShopifyCatalogProduct[]}) {
  const featured = products.slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="hero-topline"><span><i className="status-dot" /> {site.hero.eyebrow}</span><span>SHOPIFY SANDBOX COLLECTION</span></div>
        <div className="hero-copy">
          <h1>{site.hero.lines[0]}<br /><span>{site.hero.lines[1]}</span></h1>
          <p>{site.hero.body}</p>
          <Link className="button" to="/collections/all">Explore the collection <ArrowUpRight size={19} /></Link>
        </div>
        <div className="hero-object">
          {featured[0]?.image ? <img src={featured[0].image.url}
            alt={featured[0].image.altText || `${featured[0].name} concept render`}
            width={featured[0].image.width ?? 1000} height={featured[0].image.height ?? 1000} />
            : <p className="empty-state">The Shopify concept collection is being prepared.</p>}
          {featured[0] && <Link className="hero-product-label" to={`/products/${featured[0].handle}`}>
            <span><small>Explore the design</small><strong>{featured[0].name}</strong></span>
          </Link>}
        </div>
      </section>
      <section className="section collection-section" id="collection">
        <div className="section-heading"><div><p className="eyebrow">THE EVERYDAY COLLECTION</p><h2>{site.home.collectionTitle}</h2></div>
          <Link className="text-link" to="/collections/all">Explore all tools <ArrowUpRight size={19} /></Link></div>
        {featured.length ? <div className="product-grid featured-grid">{featured.map((product, index) =>
          <ProductCard key={product.id} product={product} index={index} />)}</div>
          : <div className="empty-state"><h3>Collection coming into view</h3><p>No RegenAI concepts are published to this storefront yet.</p></div>}
      </section>
    </>
  );
}

export function ShopifyCatalogView({products, search = false}: {products: ShopifyCatalogProduct[]; search?: boolean}) {
  const [params, setParams] = useSearchParams();
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
      <p className="eyebrow">THE EVERYDAY COLLECTION / SHOPIFY SANDBOX</p>
      <div className="catalog-heading"><h1>{search ? 'Find your next ritual.' : 'Room for recovery.'}</h1>
        <p>Original design studies. Ordering is closed while the sandbox is being verified.</p></div>
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
        <span>DESIGN STUDIES / ORDERING NOT OPEN</span></div>
      {filtered.length ? <div className="product-grid">{filtered.map((product, index) =>
        <ProductCard key={product.id} product={product} index={index} />)}</div>
        : <div className="empty-state"><h2>No concepts found</h2><p>{products.length ? 'Try another search or clear the filters.' : 'No RegenAI concepts are published to this storefront yet.'}</p>
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
          {sandboxCartEnabled && <Link to="/cart">View sandbox cart</Link>}
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
