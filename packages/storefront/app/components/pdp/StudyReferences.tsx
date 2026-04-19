import {ExternalLink} from 'lucide-react';

/**
 * StudyReferences — inline PubMed / journal citations that back product claims.
 * Required metafield link on any PDP that makes a health claim (compliance-lint
 * enforces on Day 41). Accessible <ol> with aria-label, external links marked.
 */

export interface StudyReference {
  pmid?: string;
  doi?: string;
  title: string;
  authors: string; // "Smith A, Jones B, et al."
  journal: string;
  year: number;
  relevanceNote?: string; // what claim this supports
}

function refUrl(s: StudyReference): string {
  if (s.doi) return `https://doi.org/${s.doi}`;
  if (s.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}`;
  return '#';
}

export function StudyReferences({items}: {items: StudyReference[]}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="studies-heading" className="rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-card)] p-5">
      <h3 id="studies-heading" className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
        Research & references
      </h3>
      <ol aria-label="Cited studies" className="space-y-3 text-sm">
        {items.map((s, i) => (
          <li key={(s.pmid ?? s.doi ?? s.title) + i} className="border-b border-[var(--color-border-default)] pb-3 last:border-0 last:pb-0">
            <p className="font-medium text-[var(--text-primary)]">{s.title}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {s.authors} · <em>{s.journal}</em> · {s.year}
              {s.pmid ? <> · PMID {s.pmid}</> : null}
            </p>
            {s.relevanceNote ? (
              <p className="mt-1 text-xs text-[var(--text-subtle)]">
                <span className="font-medium">Supports:</span> {s.relevanceNote}
              </p>
            ) : null}
            <a
              href={refUrl(s)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
            >
              View full text
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
