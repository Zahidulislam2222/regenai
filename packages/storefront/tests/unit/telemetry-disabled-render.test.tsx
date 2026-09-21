import {afterEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {createMemoryRouter, RouterProvider} from 'react-router';
import type {HeaderQuery} from 'storefrontapi.generated';
import {Aside} from '../../app/components/Aside';
import {Header} from '../../app/components/Header';
import {RecoveryQuiz} from '../../app/components/RecoveryQuiz';

const headerData: HeaderQuery = {
  shop: {
    id: 'gid://shopify/Shop/1',
    name: 'Test shop',
    description: null,
    primaryDomain: {url: 'https://regenai.myshopify.com'},
    brand: null,
  },
  menu: {id: 'gid://shopify/Menu/1', items: []},
};

describe('telemetry-disabled storefront rendering', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders Header and its cart interaction without Analytics.Provider or network calls', async () => {
    const fetchMock = vi.fn(async () => new Response('', {status: 200}));
    vi.stubGlobal('fetch', fetchMock);
    const router = createMemoryRouter(
      [{path: '/', element: <Aside.Provider>
        <Header
          header={headerData}
          cart={Promise.resolve(null)}
          isLoggedIn={Promise.resolve(false)}
          publicStoreDomain="regenai.myshopify.com"
        />
        <Aside type="cart" heading="Cart"><p>Cart panel opened</p></Aside>
      </Aside.Provider>}],
      {initialEntries: ['/']},
    );

    render(<RouterProvider router={router} />);
    const cartLink = await screen.findByRole('link', {name: /cart/i});
    fireEvent.click(cartLink);

    expect(screen.getByText('Cart panel opened')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders and completes RecoveryQuiz without Analytics.Provider or telemetry requests', async () => {
    localStorage.clear();
    const fetchMock = vi.fn(async () => new Response('', {status: 200}));
    vi.stubGlobal('fetch', fetchMock);
    const router = createMemoryRouter(
      [{path: '/', element: <RecoveryQuiz />}],
      {
        initialEntries: [
          '/?step=experience&body=knees&pain=7&context=athletic&goal=mobility&time=15-30&experience=some',
        ],
      },
    );

    render(<RouterProvider router={router} />);
    fireEvent.click(screen.getByRole('button', {name: /finish quiz/i}));

    expect(await screen.findByText(/quiz saved/i)).toBeInTheDocument();
    expect(localStorage.getItem('regenai:quiz_result:pending')).toContain('knees');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
