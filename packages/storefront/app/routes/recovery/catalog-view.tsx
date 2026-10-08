import {useSearchParams} from 'react-router';
import {site} from '~/content/recovery';
import {CatalogView} from '~/features/recovery/Experience';

export function RecoveryCatalogView({search = false}: {search?: boolean}) {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const requestedCategory = params.get('category') ?? '';
  const category = site.categories.includes(requestedCategory)
    ? requestedCategory
    : 'All tools';
  const sort = params.get('sort') ?? 'featured';

  const update = (key: string, value: string) => {
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
      onQueryChange={(value) => update('q', value)}
      onCategoryChange={(value) => update('category', value)}
      onSortChange={(value) => update('sort', value)}
      onClear={() => setParams({})}
    />
  );
}
