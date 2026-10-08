import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {SupportAssistant} from '../../app/features/recovery/SupportAssistant';
import {ui} from '../../app/content/recovery-ui';

afterEach(() => {cleanup(); vi.unstubAllGlobals();});

describe('storefront support assistant', () => {
  it('makes no requests until the visitor opens the accessible dialog', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetch);
    render(<SupportAssistant />);
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: ui.assistant_label}));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(ui.assistant_unavailable));
    expect(screen.getByRole('dialog')).toHaveAccessibleName(ui.assistant_title);
    expect(screen.getByRole('link', {name: ui.assistant_studio})).toHaveAttribute('href', '/assistant');
  });

  it('restores the server session and submits questions using same-origin credentials', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ok: true, json: async () => ({role: 'demo'})})
      .mockResolvedValueOnce({ok: true, json: async () => ({message_max_chars: 4000})})
      .mockResolvedValueOnce({ok: true, json: async () => ({messages: [{id: 'test-history', role: 'assistant', text: 'Restored context.'}]})})
      .mockResolvedValueOnce({ok: true, json: async () => ({answer: 'Ordering is not open yet.'})});
    vi.stubGlobal('fetch', fetch);
    render(<SupportAssistant />);
    fireEvent.click(screen.getByRole('button', {name: ui.assistant_label}));
    await screen.findByText('Restored context.');
    fireEvent.change(screen.getByLabelText(ui.assistant_message), {target: {value: 'Can I order?'}});
    fireEvent.click(screen.getByRole('button', {name: ui.assistant_send}));
    await screen.findByText('Ordering is not open yet.');
    expect(fetch).toHaveBeenLastCalledWith('/assistant/api/chat', expect.objectContaining({
      method: 'POST', credentials: 'same-origin', body: JSON.stringify({message: 'Can I order?'}),
    }));
  });
});
