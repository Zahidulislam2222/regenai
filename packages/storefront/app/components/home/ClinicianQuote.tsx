/**
 * ClinicianQuote — testimonial from a clinician partner (metaobject-driven
 * in Phase 1 once Clinician metaobjects are seeded). Placeholder copy
 * mirrors brand voice: evidence-first, not hype.
 */

export function ClinicianQuote() {
  return (
    <section
      aria-label="Clinician testimonial"
      className="bg-[var(--color-bone-subtle)] py-14 sm:py-20"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <figure className="text-center">
          <svg
            className="mx-auto mb-4 h-8 w-8 text-[var(--color-sage)]"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 32 32"
          >
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4Zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4Z" />
          </svg>
          <blockquote className="text-xl font-medium text-[var(--text-primary)] sm:text-2xl">
            "Most recovery devices are marketing. RegenAI's clinician-review process gets the copy as close to the evidence as I've seen on a DTC site."
          </blockquote>
          <figcaption className="mt-4 text-sm text-[var(--text-secondary)]">
            — Dr. Marwan Al-Hashimi, DPT, PT · Clinical advisor
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
