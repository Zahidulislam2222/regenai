import {Link} from 'react-router';
import {ArrowUpRight} from 'lucide-react';
import {site} from '../../content/recovery';
import {ui} from '../../content/recovery-ui';

export function RecoveryErrorContent({notFound}: {notFound: boolean}) {
  const copy = notFound ? site.errors.notFound : site.errors.unavailable;

  return (
    <section className="page empty-state">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      <Link className="button" to="/">
        {ui.back_to_regenai_a67cbe}
        <ArrowUpRight size={18} />
      </Link>
    </section>
  );
}
