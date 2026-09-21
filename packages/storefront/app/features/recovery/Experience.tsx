import {ui} from '../../content/recovery-ui';
import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {
  Link,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  Plus,
  Search,
  X,
  Check,
  SlidersHorizontal,
  MoveUpRight,
  Pause,
  Play,
} from 'lucide-react';
import {
  site,
  products,
  media,
  type RecoveryProduct,
} from '../../content/recovery';
import {money, recoverySettings} from '../../config/recovery';
import {useBag, BagContents} from './Bag';
import {findProducts, recommend} from './commerce';
import {Mark, RecoveryShell, useRecoveryMotion} from './RecoveryShell';
import {RecoveryErrorContent} from './RecoveryErrorContent';
export {RecoveryShell, useRecoveryMotion} from './RecoveryShell';
const ProductScene = lazy(() => import('./ProductScene'));
function ScenePoster() {
  return (
    <div className="product-scene">
      <img
        className="scene-poster"
        src={recoverySettings.scene.poster}
        alt={ui.pulse_one_device_concept_674487}
        width="1000"
        height="1000"
      />
    </div>
  );
}
function ProductVisual({
  paused = false,
  progress = 0,
  angle = 0,
}: {
  paused?: boolean;
  progress?: number;
  angle?: number;
}) {
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  if (!clientReady) return <ScenePoster />;

  return (
    <Suspense fallback={<ScenePoster />}>
      <ProductScene paused={paused} progress={progress} angle={angle} />
    </Suspense>
  );
}
function PageReset() {
  const {pathname} = useLocation();
  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'instant'});
    document.title = `${pathname === '/' ? 'Make room for recovery' : pathname.split('/').filter(Boolean).pop()?.replaceAll('-', ' ')} — RegenAI`;
    const main = document.getElementById('main-content');
    main?.focus({preventScroll: true});
  }, [pathname]);
  return null;
}
export function Experience() {
  const motion = useRecoveryMotion();
  return (
    <RecoveryShell {...motion}>
      <PageReset />
      <Routes>
        <Route path="/" element={<HomeView paused={motion.paused} />} />
        <Route path="/collections/all" element={<PreviewCatalogRoute />} />
        <Route path="/search" element={<PreviewCatalogRoute search />} />
        <Route
          path="/products/:id"
          element={<PreviewProductRoute paused={motion.paused} />}
        />
        <Route path="/quiz" element={<FinderView />} />
        <Route path="/cart" element={<CartView />} />
        <Route path="/about" element={<InfoView page="about" />} />
        <Route path="/evidence" element={<InfoView page="evidence" />} />
        <Route path="/policies/:policy" element={<PreviewPolicyRoute />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </RecoveryShell>
  );
}

function PreviewCatalogRoute({search = false}: {search?: boolean}) {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const category = site.categories.includes(params.get('category') ?? '')
    ? params.get('category')!
    : 'All tools';
  const sort = params.get('sort') ?? 'featured';
  const set = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      {replace: true, preventScrollReset: true},
    );
  };
  return (
    <CatalogView
      query={query}
      category={category}
      sort={sort}
      search={search}
      onQueryChange={(value) => set('q', value)}
      onCategoryChange={(value) => set('category', value)}
      onSortChange={(value) => set('sort', value)}
      onClear={() => setParams({})}
    />
  );
}

function PreviewProductRoute({paused}: {paused: boolean}) {
  const {id} = useParams();
  const product = products.find((item) => item.id === id);
  return product ? (
    <ProductDetailView key={product.id} product={product} paused={paused} />
  ) : (
    <NotFoundView />
  );
}

function PreviewPolicyRoute() {
  const {policy} = useParams();
  return policy === 'privacy' || policy === 'delivery' ? (
    <InfoView page={policy} />
  ) : (
    <NotFoundView />
  );
}

export function HomeView({paused}: {paused: boolean}) {
  return (
    <>
      <section className="hero">
        <div className="hero-grain" />
        <div className="hero-topline">
          <span>
            <i className="status-dot" /> {site.hero.eyebrow}
          </span>
          <span>{ui.collection_001_everyday_tools_5e408a}</span>
        </div>
        <div className="hero-copy">
          <h1>
            {site.hero.lines[0]}
            <br />
            <span>{site.hero.lines[1]}</span>
          </h1>
          <p>{site.hero.body}</p>
          <Link className="button" to="/collections/all">
            {site.hero.primary} <ArrowUpRight size={19} />
          </Link>
          <Link className="hero-secondary" to="/quiz">
            {site.hero.secondary}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="hero-object">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="object-cross cross-a">{ui._a318c2}</span>
          <span className="object-cross cross-b">{ui._a318c2}</span>
          <ProductVisual paused={paused} />
          <div className="object-shadow" />
          <Link className="hero-product-label" to="/products/pulse">
            <span>
              <small>{ui.meet_your_everyday_essential_bc05c1}</small>
              <strong>
                {ui.pulse_one_002547}
                <span>{ui._ca29ed}</span>
              </strong>
            </span>
            <span className="product-index">{ui['01_06_615101']}</span>
          </Link>
        </div>
        <div className="hero-bottom">
          <a href="#collection" className="scroll-cue">
            <ArrowDown size={15} />
            {ui.scroll_to_find_your_rhythm_962ea0}
          </a>
          <span>{ui.designed_with_intention_built_as_a_concept_1aeeef}</span>
        </div>
      </section>
      <div className="principle-strip">
        <span>{ui.recovery_is_personal_011ec7}</span>
        <span>
          <span className="mini-star">{ui._20baed}</span>
          {ui.make_it_part_of_your_everyday_6bbdf7}
        </span>
        <Link to="/evidence">
          {ui.clarity_before_claims_234298}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <section className="section collection-section" id="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{ui['01_the_everyday_collection_3cb036']}</p>
            <h2>{site.home.collectionTitle}</h2>
          </div>
          <Link className="text-link" to="/collections/all">
            {ui.explore_all_tools_67bc41}
            <ArrowUpRight size={19} />
          </Link>
        </div>
        <p className="section-intro">{site.home.collectionBody}</p>
        <div className="product-grid featured-grid">
          {products.slice(0, 3).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
      <Inspection paused={paused} />
      <section className="section ritual-section">
        <div className="ritual-index">
          <Mark />
          <p className="eyebrow">
            {ui.a_different_kind_of_daily_practice_152dba}
          </p>
        </div>
        <h2>{site.home.approachTitle}</h2>
        <div className="ritual-bottom">
          <p>{site.home.approachBody}</p>
          <Link className="button button-outline" to="/about">
            {ui.the_thinking_behind_regenai_c594ea}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <LabFilm paused={paused} />
      <section className="finder-invitation section">
        <div>
          <p className="eyebrow">{ui.your_body_your_rhythm_5bab79}</p>
          <h2>
            {ui.where_would_you_64109b}
            <br />
            {ui.like_to_begin_c34e4d}
          </h2>
          <p>{ui.start_with_your_everyday_find_a_tool_that_fit_bbdd34}</p>
          <Link to="/quiz" className="button">
            {ui.find_your_recovery_ritual_f6ba91}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <BodyMap value="" onSelect={() => {}} decorative />
        <div className="invitation-areas">
          {site.areas.map((a, i) => (
            <Link to={`/collections/all?q=${encodeURIComponent(a)}`} key={a}>
              <span>
                {ui['0_5feceb']}
                {i + 1}
              </span>
              {a}
              <MoveUpRight size={20} />
            </Link>
          ))}
        </div>
      </section>
      <div className="demo-ribbon">
        {site.demo}{' '}
        <Link to="/evidence">
          {ui.what_s_real_in_this_demo_6cceea}
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </>
  );
}
function ProductCard({
  product: p,
  index = 0,
}: {
  product: RecoveryProduct;
  index?: number;
}) {
  return (
    <article className={`product-card product-${p.id}`}>
      <Link
        to={`/products/${p.id}`}
        className="product-card-image"
        aria-label={`Explore ${p.name}`}
      >
        <span className="card-category">{p.category}</span>
        <span className="card-index">
          {ui['0_5feceb']}
          {index + 1}
        </span>
        <img
          src={p.image}
          alt={`${p.name}, ${p.kind.toLowerCase()}, concept render`}
          loading="lazy"
          width="1000"
          height="1000"
        />
        <span className="card-plus">
          <Plus size={19} />
        </span>
      </Link>
      <div className="product-card-info">
        <div>
          <Link to={`/products/${p.id}`}>
            <h3>{p.name}</h3>
          </Link>
          <p>{p.kind}</p>
        </div>
        <span>{money(p.price)}</span>
      </div>
    </article>
  );
}
function Inspection({paused}: {paused: boolean}) {
  const root = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (paused) {
      setProgress(0);
      return;
    }
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = root.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setProgress(
          Math.max(
            0,
            Math.min(1, -rect.top / (rect.height - window.innerHeight)),
          ),
        );
      });
    };
    window.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [paused]);
  const active = Math.min(2, Math.floor(progress * 3));
  return (
    <section
      className={`inspection ${paused ? 'inspection-static' : ''}`}
      ref={root}
      aria-label={ui.pulse_one_product_inspection_2a3ef4}
    >
      <div className="inspection-sticky">
        <div className="inspection-title">
          <p className="eyebrow">{ui['02_a_closer_look_995d7a']}</p>
          <span>{ui.thoughtful_down_to_the_detail_111d97}</span>
        </div>
        <div className="inspection-stage">
          <div className="inspection-word" aria-hidden="true">
            {ui.pulse_64ab2b}
          </div>
          <ProductVisual paused={paused} progress={progress} />
          <div className="inspection-tag">
            <span className="status-dot" /> {site.inspection[active].label}
          </div>
        </div>
        <div className="inspection-content">
          {site.inspection.map((s, i) => (
            <article
              key={s.number}
              className={`inspection-step ${active === i ? 'active' : ''}`}
              aria-hidden={!paused && active !== i}
            >
              <span className="chapter-number">
                {ui._8a5eda}
                {s.number}
              </span>
              <h2>{s.title}</h2>
              <p>{s.body}</p>
            </article>
          ))}
          <Link to="/products/pulse" className="text-link">
            {ui.explore_pulse_one_043eba}
            <ArrowUpRight size={18} />
          </Link>
          <div className="chapter-bars" aria-hidden="true">
            {site.inspection.map((s, i) => (
              <span className={active >= i ? 'filled' : ''} key={s.number} />
            ))}
          </div>
          <small>
            {ui.original_industrial_design_concept_not_a_manu_83cbae}
          </small>
        </div>
      </div>
    </section>
  );
}
function LabFilm({paused}: {paused: boolean}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(media.lab.videoAvailable);
  useEffect(() => {
    if (paused) {
      video.current?.pause();
      setPlaying(false);
    }
  }, [paused]);
  return (
    <section className="lab-film">
      <img
        src={media.lab.image}
        alt={media.lab.alt}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      {available && (
        <video
          ref={video}
          muted
          playsInline
          loop
          preload="none"
          poster={media.lab.image}
          onError={() => {
            setAvailable(false);
            setPlaying(false);
          }}
        >
          <source src={media.lab.video} type="video/mp4" />
        </video>
      )}
      <div className="lab-overlay">
        <p className="eyebrow">{ui['03_the_recovery_lab_5b92f6']}</p>
        <h2>{site.home.labTitle}</h2>
        <p>{site.home.labBody}</p>
        {available ? (
          <button
            className="film-control"
            onClick={() => {
              if (playing) {
                video.current?.pause();
                setPlaying(false);
              } else {
                void video.current
                  ?.play()
                  .then(() => setPlaying(true))
                  .catch(() => {
                    setAvailable(false);
                    setPlaying(false);
                  });
              }
            }}
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}{' '}
            {playing ? 'Pause the film' : 'Enter the studio'}
          </button>
        ) : (
          <Link className="text-link" to="/about">
            {ui.explore_our_approach_237c05}
            <ArrowUpRight size={18} />
          </Link>
        )}
      </div>
      <span className="film-caption">
        {ui.an_architectural_concept_regenai_f85161}
      </span>
    </section>
  );
}
export function CatalogView({
  query,
  category,
  sort,
  search = false,
  onQueryChange,
  onCategoryChange,
  onSortChange,
  onClear,
}: {
  query: string;
  category: string;
  sort: string;
  search?: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClear: () => void;
}) {
  const items = findProducts({query, category, sort});
  return (
    <section className="page catalog-page">
      <p className="eyebrow">{ui.the_everyday_collection_concept_001_f85835}</p>
      <div className="catalog-heading">
        <h1>{search ? 'Find your next ritual.' : 'Room for recovery.'}</h1>
        <p>
          {ui.considered_tools_for_a_more_intentional_every_b585f3}
          <br />
          {ui.explore_the_concept_collection_32c8ae}
        </p>
      </div>
      <div className="catalog-toolbar">
        <div
          className="category-tabs"
          aria-label={ui.product_categories_b5c3b3}
        >
          {site.categories.map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              onClick={() => onCategoryChange(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="search-input">
          <Search size={18} />
          <span className="sr-only">{ui.search_products_c65cb6}</span>
          <input
            type="search"
            placeholder={ui.find_a_tool_ad0204}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </label>
        <label className="sort-select">
          <SlidersHorizontal size={16} />
          <span className="sr-only">{ui.sort_products_2fc7a4}</span>
          <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
            <option value="featured">{ui.featured_c533ca}</option>
            <option value="price-asc">{ui.price_low_to_high_b46704}</option>
            <option value="price-desc">{ui.price_high_to_low_f2aec5}</option>
          </select>
        </label>
      </div>
      <div className="results-summary">
        <span role="status">
          {items.length} {items.length === 1 ? 'tool' : 'tools'}
          {ui.to_explore_9d9671}
        </span>
        {(query || category !== 'All tools' || sort !== 'featured') && (
          <button className="text-button" onClick={onClear}>
            {ui.clear_filters_1c7912}
            <X size={14} />
          </button>
        )}
        <span>{ui.example_prices_usd_405370}</span>
      </div>
      {items.length ? (
        <div className="product-grid">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{ui.no_tools_found_18ea65}</h2>
          <p>{ui.try_another_search_or_clear_your_filters_7dae6d}</p>
          <button className="button" onClick={onClear}>
            {ui.show_the_collection_23d0d4}
            <ArrowUpRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}
export function ProductDetailView({
  product: p,
  paused,
}: {
  product: RecoveryProduct;
  paused: boolean;
}) {
  const [option, setOption] = useState(p.options[0]);
  const [angle, setAngle] = useState(0);
  const {add} = useBag();
  return (
    <section className="page product-page">
      <Link to="/collections/all" className="back-link">
        <ArrowLeft size={16} />
        {ui.the_collection_cd3527}
      </Link>
      <div className="product-layout">
        <div className={`product-gallery product-${p.id}`}>
          <span className="eyebrow">
            {p.category}
            {ui.concept_collection_4f1f19}
          </span>
          {p.id === 'pulse' ? (
            <>
              <ProductVisual paused={paused} angle={angle} />
              <div className="view-controls">
                <button
                  onClick={() => setAngle((a) => a - 0.6)}
                  aria-label={ui.rotate_product_left_34e0c1}
                >
                  <ArrowLeft size={17} />
                </button>
                <span>{ui.explore_in_3d_4f8426}</span>
                <button
                  onClick={() => setAngle((a) => a + 0.6)}
                  aria-label={ui.rotate_product_right_a94f32}
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </>
          ) : (
            <img
              src={p.image}
              alt={`${p.name} concept design`}
              width="1000"
              height="1000"
            />
          )}
        </div>
        <div className="product-details">
          <p className="eyebrow">{p.kind}</p>
          <h1>{p.name}</h1>
          <p className="product-description">{p.description}</p>
          <div className="pdp-price">
            <strong>{money(p.price)}</strong>
            <span>{ui.example_price_usd_1dda14}</span>
          </div>
          <div className="color-row">
            <span className={`color-dot ${p.id}`} />
            {p.color}
          </div>
          <fieldset className="product-options">
            <legend>{ui.choose_your_option_9c33f7}</legend>
            {p.options.map((o) => (
              <label className={option === o ? 'selected' : ''} key={o}>
                <input
                  type="radio"
                  name="product-option"
                  value={o}
                  checked={option === o}
                  onChange={() => setOption(o)}
                />
                {o}
                {option === o && <Check size={16} />}
              </label>
            ))}
          </fieldset>
          <button className="button full" onClick={() => add(p.id, option)}>
            {ui.add_to_bag_23a264}
            <Plus size={19} />
          </button>
          <p className="small muted">
            {ui.local_demo_no_payment_shipping_or_order_place_dd1738}
          </p>
          <div className="product-accordions">
            <details open>
              <summary>
                {ui.the_details_01ed7e}
                <Plus size={17} />
              </summary>
              <p>{p.detail}</p>
              <dl>
                {p.specs.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </details>
            <details>
              <summary>
                {ui.evidence_product_status_a30ec1}
                <Plus size={17} />
              </summary>
              <p>
                {ui.this_is_an_original_design_concept_performanc_dacbcd}{' '}
                <Link to="/evidence">
                  {ui.read_our_transparency_statement_306676}
                </Link>
              </p>
            </details>
            <details>
              <summary>
                {ui.delivery_returns_a2dcb2}
                <Plus size={17} />
              </summary>
              <p>
                {ui.no_products_are_shipped_from_this_demo_331435}{' '}
                <Link to="/policies/delivery">
                  {ui.see_the_demo_terms_9a9a7f}
                </Link>
              </p>
            </details>
          </div>
        </div>
      </div>
      <div className="section-heading related-heading">
        <h2>{ui.build_your_everyday_ritual_57a6a8}</h2>
        <Link to="/collections/all" className="text-link">
          {ui.all_tools_c2af02}
          <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="product-grid">
        {products
          .filter((item) => item.id !== p.id)
          .slice(0, 3)
          .map((item, i) => (
            <ProductCard product={item} index={i} key={item.id} />
          ))}
      </div>
    </section>
  );
}
export function CartView() {
  return (
    <div className="page narrow">
      <p className="eyebrow">{ui.your_collection_032a5e}</p>
      <h1>{ui.your_bag_a3fe52}</h1>
      <BagContents />
    </div>
  );
}

function BodyMap({
  value,
  onSelect,
  decorative = false,
}: {
  value: string;
  onSelect: (v: string) => void;
  decorative?: boolean;
}) {
  const points = site.bodyPoints;
  return (
    <div className={`body-map ${decorative ? 'body-decorative' : ''}`}>
      <svg viewBox="0 0 360 470" aria-hidden="true">
        <defs>
          <linearGradient
            id={decorative ? 'body-fill-decorative' : 'body-fill'}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop stopColor="#dddcd5" />
            <stop offset="1" stopColor="#a8b2a5" />
          </linearGradient>
        </defs>
        <ellipse cx="180" cy="438" rx="70" ry="9" fill="#d8dad1" />
        <path
          d="M180 32c-23 0-32 18-31 38 0 17 8 33 19 37v15l-37 10c-13 5-20 14-24 31l-20 95-15 38c-6 17 4 23 12 9l20-35 25-69 3 52-4 28 8 86 8 59c1 9-7 16-9 21h37l-2-21 4-53 6-58 6 58 4 53-2 21h37c-2-5-10-12-9-21l8-59 8-86-4-28 3-52 25 69 20 35c8 14 18 8 12-9l-15-38-20-95c-4-17-11-26-24-31l-37-10v-15c11-4 19-20 19-37 1-20-8-38-31-38Z"
          fill={`url(#${decorative ? 'body-fill-decorative' : 'body-fill'})`}
        />
        <path
          d="M180 132v125M151 272l29 12 29-12M158 181l22 11 22-11"
          stroke="#81917d"
          opacity=".35"
          fill="none"
        />
      </svg>
      {points.map((p) =>
        decorative ? (
          <span
            className="body-point"
            key={p.label}
            style={{left: `${p.x / 3.6}%`, top: `${p.y / 4.7}%`}}
          />
        ) : (
          <button
            key={p.label}
            className={`body-point ${value === p.label ? 'selected' : ''}`}
            style={{left: `${p.x / 3.6}%`, top: `${p.y / 4.7}%`}}
            onClick={() => onSelect(p.label)}
            aria-label={`Select ${p.label}`}
            aria-pressed={value === p.label}
          >
            <Plus size={14} />
          </button>
        ),
      )}
    </div>
  );
}
export function FinderView() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(['', '', '']);
  const [complete, setComplete] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, [step, complete]);
  const choose = (value: string) =>
    setAnswers((current) => current.map((v, i) => (i === step ? value : v)));
  const reset = () => {
    setAnswers(['', '', '']);
    setStep(0);
    setComplete(false);
  };
  if (complete) {
    const matches = recommend(answers[0], answers[2]);
    return (
      <section className="page finder-result">
        <p className="eyebrow">{ui.your_everyday_collection_06a4fb}</p>
        <h1 ref={title} tabIndex={-1}>
          {site.finder.resultTitle}
        </h1>
        <p className="result-explanation">
          {ui.you_chose_f9fb4f}
          <strong>{answers[0].toLowerCase()}</strong>
          {ui.a_day_810b38} <strong>{answers[1].toLowerCase()}</strong>
          {ui.and_more_e26528} <strong>{answers[2].toLowerCase()}</strong>
          {matches.every((product) => product.category === answers[2])
            ? ui.these_tools_match_your_focus_area_and_preferr_1b0321
            : ui.finder_area_fallback}
        </p>
        <div className="product-grid">
          {matches.map((p, i) => (
            <ProductCard product={p} index={i} key={p.id} />
          ))}
        </div>
        <p className="demo-notice">{site.finder.disclaimer}</p>
        <button className="text-link" onClick={reset}>
          <ArrowLeft size={18} />
          {ui.start_again_32c266}
        </button>
      </section>
    );
  }
  return (
    <section className="page finder-page">
      <div className="finder-top">
        <div>
          <p className="eyebrow">{ui.the_recovery_finder_df8971}</p>
          <h1>{site.finder.title}</h1>
          <p>{site.finder.intro}</p>
        </div>
        <span className="finder-count">
          {ui['0_5feceb']}
          {step + 1}
          <small>{ui['03_d9e3d2']}</small>
        </span>
      </div>
      <div
        className="finder-progress"
        role="progressbar"
        aria-label={ui.finder_progress_883b1f}
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={3}
      >
        <span style={{width: `${((step + 1) / 3) * 100}%`}} />
      </div>
      <div className="finder-layout">
        <div className="finder-illustration">
          <BodyMap
            value={answers[0]}
            onSelect={(v) => {
              setAnswers((a) => [v, a[1], a[2]]);
            }}
            decorative={step !== 0}
          />
          <span className="eyebrow">
            {ui.your_body_your_starting_point_29073c}
          </span>
        </div>
        <div className="finder-questions">
          <p className="eyebrow">
            {ui.question_0_22ec6d}
            {step + 1}
          </p>
          <h2 ref={title} tabIndex={-1}>
            {site.finder.steps[step].title}
          </h2>
          <p>{site.finder.steps[step].hint}</p>
          <fieldset className="finder-options">
            <legend className="sr-only">{site.finder.steps[step].title}</legend>
            {site.finder.steps[step].options.map((o, i) => (
              <label className={answers[step] === o ? 'selected' : ''} key={o}>
                <input
                  type="radio"
                  name={`finder-${step}`}
                  checked={answers[step] === o}
                  onChange={() => choose(o)}
                />
                <span>
                  {ui['0_5feceb']}
                  {i + 1}
                </span>
                {o}
                <span className="option-check">
                  {answers[step] === o ? (
                    <Check size={17} />
                  ) : (
                    <Plus size={17} />
                  )}
                </span>
              </label>
            ))}
          </fieldset>
          <div className="finder-buttons">
            <button
              className="text-link"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft size={17} />
              {ui.back_709d90}
            </button>
            <button
              className="button"
              disabled={!answers[step]}
              onClick={() =>
                step === 2 ? setComplete(true) : setStep((s) => s + 1)
              }
            >
              {step === 2 ? 'See my collection' : 'Continue'}
              <ArrowRight size={17} />
            </button>
          </div>
          <p className="small muted">
            {ui.private_by_design_your_answers_aren_t_saved_o_806170}
          </p>
        </div>
      </div>
    </section>
  );
}
export function InfoView({page}: {page: keyof typeof site.pages}) {
  const p = site.pages[page];
  return (
    <section className="page info-page">
      <p className="eyebrow">{p.eyebrow}</p>
      <h1>{p.title}</h1>
      <p className="info-intro">{p.body}</p>
      <div className="info-sections">
        {p.sections.map(([title, body], i) => (
          <article key={title}>
            <span className="eyebrow">
              {ui['0_5feceb']}
              {i + 1}
            </span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <Link className="button" to="/collections/all">
        {ui.explore_the_collection_9d5be0}
        <ArrowUpRight size={18} />
      </Link>
    </section>
  );
}
export function NotFoundView() {
  return <RecoveryErrorContent notFound />;
}
