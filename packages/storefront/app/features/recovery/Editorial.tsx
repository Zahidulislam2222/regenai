import {ArrowLeft, ArrowUpRight} from 'lucide-react';
import {Link} from 'react-router';
import {editorial, type Story} from '../../content/recovery-editorial';

export function CategoryExplore({catalogMode = 'fixture'}: {catalogMode?: 'fixture' | 'shopify'}) {
  return (
    <section className="editorial-section category-explore" aria-labelledby="category-explore-title">
      <div className="editorial-heading">
        <p className="eyebrow">{editorial.ui.categoriesEyebrow}</p>
        <h2 id="category-explore-title">{editorial.ui.categoriesTitle}</h2>
        <p>{editorial.ui.categoriesIntro}</p>
      </div>
      <div className="category-explore-grid">
        {editorial.categories.map((category) => (
          <Link
            className={`category-explore-card category-explore-${category.slug}`}
            key={category.slug}
            to={catalogMode === 'shopify' ? `/collections/${category.slug}`
              : `/collections/all?category=${encodeURIComponent(category.filter)}`}
          >
            <span className="eyebrow">{category.label}</span>
            <img src={category.image} alt={category.alt} loading="lazy" width="1000" height="1000" />
            <span className="category-explore-copy">
              <strong>{category.title}</strong>
              <span>{category.body}</span>
              <span className="category-explore-action">{editorial.ui.categoryAction} {category.filter} <ArrowUpRight size={17} /></span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function JournalFeature() {
  const [lead, ...more] = editorial.stories;
  return (
    <section className="editorial-section journal-feature" aria-labelledby="journal-feature-title">
      <div className="editorial-heading editorial-heading-inline">
        <div>
          <p className="eyebrow">{editorial.ui.journalEyebrow}</p>
          <h2 id="journal-feature-title">{editorial.ui.journalTitle}</h2>
        </div>
        <Link className="text-link" to="/journal">{editorial.ui.journalAll} <ArrowUpRight size={18} /></Link>
      </div>
      <div className="journal-feature-grid">
        <Link className="journal-lead" to={`/journal/${lead.slug}`}>
          <img src={lead.image} alt={lead.alt} loading="lazy" width="1000" height="1000" />
          <span className="journal-lead-copy">
            <span className="eyebrow">{lead.eyebrow}</span>
            <strong>{lead.title}</strong>
            <span>{lead.summary}</span>
            <span className="category-explore-action">{editorial.ui.journalLeadAction} <ArrowUpRight size={17} /></span>
          </span>
        </Link>
        <div className="journal-more">
          {more.map((story) => (
            <Link key={story.slug} to={`/journal/${story.slug}`}>
              <span className="eyebrow">{story.eyebrow}</span>
              <strong>{story.title}</strong>
              <span>{story.summary}</span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeQuestions() {
  return (
    <section className="editorial-section home-questions" aria-labelledby="home-questions-title">
      <div className="editorial-heading">
        <p className="eyebrow">{editorial.ui.questionsEyebrow}</p>
        <h2 id="home-questions-title">{editorial.ui.questionsTitle}</h2>
      </div>
      <div className="home-question-list">
        {editorial.questions.map(({question, answer}) => (
          <details key={question}>
            <summary>{question}<span aria-hidden="true">+</span></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function JournalIndexView() {
  return (
    <div className="page journal-page">
      <div className="journal-page-heading">
        <p className="eyebrow">{editorial.ui.journalPageEyebrow}</p>
        <h1>{editorial.ui.journalPageTitle}</h1>
        <p>{editorial.ui.journalPageIntro}</p>
      </div>
      <div className="journal-index-grid">
        {editorial.stories.map((story) => (
          <Link className="journal-index-card" key={story.slug} to={`/journal/${story.slug}`}>
            <img src={story.image} alt={story.alt} loading="lazy" width="1000" height="1000" />
            <span className="eyebrow">{story.eyebrow}</span>
            <strong>{story.title}</strong>
            <span>{story.summary}</span>
            <span className="category-explore-action">{editorial.ui.journalCardAction} <ArrowUpRight size={17} /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function JournalArticleView({story}: {story: Story}) {
  return (
    <article className="page journal-article">
      <Link className="journal-back" to="/journal"><ArrowLeft size={17} /> {editorial.ui.journalAll}</Link>
      <header>
        <p className="eyebrow">{story.eyebrow}</p>
        <h1>{story.title}</h1>
        <p>{story.summary}</p>
      </header>
      <img className="journal-article-image" src={story.image} alt={story.alt} width="1000" height="1000" />
      <div className="journal-article-body">
        {story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <Link className="text-link" to="/journal">{editorial.ui.journalMoreAction} <ArrowUpRight size={18} /></Link>
    </article>
  );
}
