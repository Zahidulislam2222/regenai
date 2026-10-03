import raw from './recovery-editorial.json';

type Category = {slug: string; filter: string; label: string; title: string; body: string; image: string; alt: string};
export type Story = {slug: string; eyebrow: string; title: string; summary: string; image: string;
  alt: string; paragraphs: string[]; shopifyParagraphs?: string[]};
type Question = {id: string; question: string; answer: string};

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasMedia(value: unknown): value is string {
  return hasText(value) && /^\/media\/[a-z0-9.-]+$/.test(value);
}

function validateCategories(value: unknown): Category[] {
  if (!Array.isArray(value) || value.length !== 3) throw new Error('Invalid category content');
  const slugs = new Set<string>();
  return value.map((entry: unknown) => {
    const item = entry as Category;
    if (!/^[a-z0-9-]+$/.test(item.slug) || slugs.has(item.slug) || !['Release', 'Move', 'Reset'].includes(item.filter) || !hasText(item.label) ||
      !hasText(item.title) || !hasText(item.body) || !hasMedia(item.image) || !hasText(item.alt)) {
      throw new Error('Invalid category content');
    }
    slugs.add(item.slug);
    return item;
  });
}

function validateStories(value: unknown): Story[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('Invalid editorial content');
  const slugs = new Set<string>();
  return value.map((entry: unknown) => {
    const item = entry as Story;
    if (!/^[a-z0-9-]+$/.test(item.slug) || slugs.has(item.slug) || !hasText(item.eyebrow) ||
      !hasText(item.title) || !hasText(item.summary) || !hasMedia(item.image) || !hasText(item.alt) ||
      !Array.isArray(item.paragraphs) || item.paragraphs.length < 2 || !item.paragraphs.every(hasText) ||
      (item.shopifyParagraphs !== undefined &&
        (!Array.isArray(item.shopifyParagraphs) || item.shopifyParagraphs.length < 2 ||
          !item.shopifyParagraphs.every(hasText)))) {
      throw new Error('Invalid editorial content');
    }
    slugs.add(item.slug);
    return item;
  });
}

function validateQuestions(value: unknown): Question[] {
  const ids = new Set<string>();
  if (!Array.isArray(value) || value.length === 0 ||
    !value.every((entry: unknown) => {
      const item = entry as Partial<Question>;
      if (!hasText(item.id) || !/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id)) return false;
      ids.add(item.id);
      return hasText(item.question) && hasText(item.answer);
    })) {
    throw new Error('Invalid question content');
  }
  return value as Question[];
}

function validateProductQuestions(value: unknown, questions: Question[]): Question[] {
  if (!Array.isArray(value) || value.length === 0 ||
    new Set(value).size !== value.length ||
    !value.every((id) => typeof id === 'string' && questions.some((item) => item.id === id))) {
    throw new Error('Invalid product question selection');
  }
  return (value as string[]).map((id) => {
    const item = questions.find((question) => question.id === id);
    if (!item) throw new Error('Invalid product question selection');
    return item;
  });
}

const questions = validateQuestions(raw.questions);

function validateComparisonLimit(value: unknown): number {
  if (!Number.isInteger(value) || typeof value !== 'number' || value < 2 || value > 3) {
    throw new Error('Invalid comparison limit');
  }
  return value;
}

export const editorial = {
  categories: validateCategories(raw.categories),
  stories: validateStories(raw.stories),
  questions,
  productQuestions: validateProductQuestions(raw.productQuestionIds, questions),
  comparisonLimit: validateComparisonLimit(raw.comparisonLimit),
  ui: validateUi(raw.ui),
};

export function selectJournalStory(story: Story, source: 'shopify' | 'fixture'): Story {
  return source === 'shopify' && story.shopifyParagraphs
    ? {...story, paragraphs: story.shopifyParagraphs}
    : story;
}

function validateUi(value: Record<string, unknown>): typeof raw.ui {
  if (!value || Object.values(value).some((entry) => !hasText(entry))) {
    throw new Error('Invalid editorial interface copy');
  }
  return value as typeof raw.ui;
}
