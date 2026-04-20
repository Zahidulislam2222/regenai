import {describe, it, expect} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router';
import {
  BODY_AREAS,
  BodyAreaSelector,
} from '~/components/BodyAreaSelector';

function renderWithRouter(initialEntries: string[] = ['/collections/all']) {
  const router = createMemoryRouter(
    [
      {
        path: '/collections/:handle',
        element: <BodyAreaSelector />,
      },
    ],
    {initialEntries},
  );
  return {router, ...render(<RouterProvider router={router} />)};
}

describe('BodyAreaSelector', () => {
  it('exports the eight BodyArea metaobject handles', () => {
    expect(BODY_AREAS).toEqual([
      'neck',
      'shoulders',
      'back',
      'knees',
      'hips',
      'ankles',
      'wrists',
      'core',
    ]);
  });

  it('renders an interactive button for each body area', () => {
    renderWithRouter();
    for (const area of BODY_AREAS) {
      const btn = screen.getByRole('checkbox', {name: new RegExp(area, 'i')});
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('aria-checked', 'false');
    }
  });

  it('reflects preselected ?body=knees from the URL', () => {
    renderWithRouter(['/collections/all?body=knees']);
    const knees = screen.getByRole('checkbox', {name: /knees/i});
    expect(knees).toHaveAttribute('aria-checked', 'true');
  });

  it('supports comma-separated multi-select in the URL', () => {
    renderWithRouter(['/collections/all?body=knees,back']);
    expect(
      screen.getByRole('checkbox', {name: /knees/i}),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('checkbox', {name: /back/i}),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('checkbox', {name: /neck/i}),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles selection on click and updates URL', () => {
    const {router} = renderWithRouter();
    const knees = screen.getByRole('checkbox', {name: /knees/i});
    fireEvent.click(knees);
    expect(knees).toHaveAttribute('aria-checked', 'true');
    expect(router.state.location.search).toContain('body=knees');
  });

  it('clears all selections via the Clear button', () => {
    renderWithRouter(['/collections/all?body=knees,hips']);
    const clear = screen.getByRole('button', {name: /clear/i});
    fireEvent.click(clear);
    expect(screen.queryByRole('button', {name: /clear/i})).not.toBeInTheDocument();
  });

  it('each hit button meets WCAG 2.2 target-size (≥24px)', () => {
    renderWithRouter();
    for (const area of BODY_AREAS) {
      const btn = screen.getByRole('checkbox', {name: new RegExp(area, 'i')});
      const style = btn.getAttribute('style') ?? '';
      expect(style).toMatch(/min-width:\s*24px/i);
      expect(style).toMatch(/min-height:\s*24px/i);
    }
  });

  it('announces selection via aria-live status region', () => {
    renderWithRouter();
    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', {name: /neck/i}));
    expect(statusRegion).toHaveTextContent(/selected:/i);
  });
});
