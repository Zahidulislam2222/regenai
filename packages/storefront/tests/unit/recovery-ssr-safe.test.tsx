import {StrictMode, act} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter, StaticRouter} from 'react-router';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {recoverySettings} from '../../app/config/recovery';
import {Experience} from '../../app/features/recovery/Experience';
import {BagProvider, useBag} from '../../app/features/recovery/Bag';

const persistedLines = [
  {id: 'pulse', option: 'Standard kit', quantity: 2},
];

function renderPreview(path = '/') {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <Experience />
      </MemoryRouter>
    </StrictMode>,
  );
}

function renderServerPreview(path = '/') {
  return renderToString(
    <StaticRouter location={path}>
      <Experience />
    </StaticRouter>,
  );
}

function BagProbe() {
  const bag = useBag();
  return (
    <>
      <output data-testid="bag-count">
        {bag.lines.reduce((sum, line) => sum + line.quantity, 0)}
      </output>
      <output data-testid="storage-error">
        {bag.storageError ? 'unavailable' : 'ready'}
      </output>
      <button onClick={() => bag.add('pulse', 'Standard kit')}>Add demo item</button>
    </>
  );
}

function renderBagProbe() {
  return render(
    <StrictMode>
      <MemoryRouter>
        <BagProvider>
          <BagProbe />
        </BagProvider>
      </MemoryRouter>
    </StrictMode>,
  );
}

describe('recovery experience SSR and browser hydration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('renders the selected experience without browser globals or WebGL on the server', () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('localStorage', undefined);
    vi.stubGlobal('matchMedia', undefined);

    const html = renderServerPreview('/');

    expect(html).toContain('Make room');
    expect(html).toContain('/media/pulse.png');
    expect(html).not.toContain('scene-canvas');
    expect(html).not.toContain('<canvas');
    expect(html).toContain('id="main-content"');
  });

  it('hydrates the same poster markup before mounting the client-only scene', async () => {
    const serverHtml = renderServerPreview('/');
    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    const initialPosters = container.querySelectorAll('.scene-poster');
    expect(initialPosters.length).toBeGreaterThan(0);
    expect(container.querySelector('canvas')).toBeNull();

    const recoverableErrors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(
        container,
        <MemoryRouter initialEntries={['/']}>
          <Experience />
        </MemoryRouter>,
        {onRecoverableError: (error) => recoverableErrors.push(error)},
      );
    });

    expect(recoverableErrors).toEqual([]);
    expect(container.querySelectorAll('.scene-poster').length).toBeGreaterThan(0);
    await act(async () => root?.unmount());
  });

  it('reads a populated bag before writing and preserves it across StrictMode remounts', async () => {
    const storage = window.localStorage;
    const originalGet = storage.getItem.bind(storage);
    const originalSet = storage.setItem.bind(storage);
    const key = recoverySettings.storageKey;
    originalSet(key, JSON.stringify(persistedLines));
    const events: string[] = [];
    vi.spyOn(storage, 'getItem').mockImplementation((name) => {
      events.push(`read:${name}`);
      return originalGet(name);
    });
    vi.spyOn(storage, 'setItem').mockImplementation((name, value) => {
      events.push(`write:${name}:${value}`);
      originalSet(name, value);
    });

    const view = renderBagProbe();
    await waitFor(() => expect(screen.getByTestId('bag-count')).toHaveTextContent('2'));

    const writes = events.filter((event) => event.startsWith(`write:${key}:`));
    expect(events[0]).toBe(`read:${key}`);
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0].slice(`write:${key}:`.length))).toEqual(persistedLines);
    expect(JSON.parse(originalGet(key) ?? '[]')).toEqual(persistedLines);

    view.unmount();
    renderBagProbe();
    await waitFor(() => expect(screen.getByTestId('bag-count')).toHaveTextContent('2'));
  });

  it('recovers corrupt storage as an empty demo bag', async () => {
    const storage = window.localStorage;
    const key = recoverySettings.storageKey;
    storage.setItem(key, '{corrupt');
    const corruptView = renderBagProbe();
    await waitFor(() => expect(screen.getByTestId('bag-count')).toHaveTextContent('0'));
    expect(storage.getItem(key)).toBe('[]');
    corruptView.unmount();
  });

  it('keeps the bag usable but does not overwrite storage when reads fail', async () => {
    const storage = window.localStorage;
    const key = recoverySettings.storageKey;
    const originalSet = storage.setItem.bind(storage);
    const writes: string[] = [];
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new Error('storage read denied');
    });
    vi.spyOn(storage, 'setItem').mockImplementation((name, value) => {
      if (name === key) writes.push(value);
      originalSet(name, value);
    });
    renderBagProbe();
    await waitFor(() => expect(screen.getByTestId('storage-error')).toHaveTextContent('unavailable'));
    fireEvent.click(screen.getByRole('button', {name: 'Add demo item'}));
    expect(screen.getByTestId('bag-count')).toHaveTextContent('1');
    expect(writes).toEqual([]);
  });

  it('applies reduced motion after mount while retaining all inspection content', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    } as MediaQueryList);

    const initialHtml = renderServerPreview('/');
    expect(initialHtml).toContain('class="recovery-app "');

    const view = renderPreview();
    await waitFor(() =>
      expect(document.querySelector('.recovery-app')).toHaveClass('motion-paused'),
    );
    const steps = view.container.querySelectorAll('.inspection-step');
    expect(steps.length).toBe(3);
    for (const step of steps) expect(step).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('returns focus to the bag trigger after the dialog closes', async () => {
    renderPreview('/');
    const trigger = screen.getByRole('button', {name: /open bag/i});
    trigger.focus();
    fireEvent.click(trigger);
    const close = await screen.findByRole('button', {name: /close bag/i});
    fireEvent.click(close);
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
