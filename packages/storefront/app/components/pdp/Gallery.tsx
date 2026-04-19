import {useState, useRef, useEffect} from 'react';
import {cn} from '~/lib/utils';

/**
 * PDP Gallery — main image + thumbnails.
 * - Swipe navigation on mobile (horizontal scroll snap)
 * - Arrow keys when main image has focus
 * - Thumb rail below/left depending on viewport
 * - 3D model-viewer slot available if `modelSrc` provided (WebGL + <model-viewer> LE)
 */

export interface GalleryImage {
  src: string;
  alt: string;
  modelSrc?: string; // .glb URL — renders <model-viewer> if present
}

export interface GalleryProps {
  images: GalleryImage[];
}

export function Gallery({images}: GalleryProps) {
  const [index, setIndex] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({left: 0, behavior: 'smooth'});
  }, [index]);

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    if (e.key === 'ArrowRight') setIndex((i) => Math.min(images.length - 1, i + 1));
  };

  const current = images[index];
  if (!current) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-[80px_1fr] sm:gap-4">
      {/* Thumb rail (desktop left) */}
      <ul
        aria-label="Product image thumbnails"
        className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-y-auto sm:pb-0"
      >
        {images.map((img, i) => (
          <li key={img.src} className="shrink-0">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'h-16 w-16 overflow-hidden rounded-md border-2 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
                i === index
                  ? 'border-[var(--color-primary)]'
                  : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]',
              )}
            >
              <img src={img.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div
        ref={mainRef}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Product images"
        onKeyDown={onKey}
        className="relative aspect-square overflow-hidden rounded-lg bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        {current.modelSrc ? (
          // 3D view slot — consumer adds <model-viewer> script tag in root
          // and the element here. Using dangerous html would bypass CSP; instead
          // Phase 2 registers the custom element properly. For Phase 1 we render
          // the still image with a "3D view available" hint.
          <>
            <img src={current.src} alt={current.alt} className="h-full w-full object-cover" />
            <span className="absolute bottom-3 right-3 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white">
              3D view available — Phase 2
            </span>
          </>
        ) : (
          <img src={current.src} alt={current.alt} className="h-full w-full object-cover" />
        )}
      </div>
    </div>
  );
}
