import {CartForm} from '@shopify/hydrogen';
import {useId, useState} from 'react';
import {Gift} from 'lucide-react';

/**
 * GiftNoteField — customer-facing gift note persisted on the cart via
 * Shopify's NoteUpdate action. Appears on checkout + order confirmation.
 *
 * Expanded on demand (collapsed by default to keep the summary clean).
 */
export function GiftNoteField({currentNote = ''}: {currentNote?: string}) {
  const [open, setOpen] = useState<boolean>(Boolean(currentNote));
  const [note, setNote] = useState<string>(currentNote);
  const textareaId = useId();

  return (
    <section aria-label="Gift note" className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--color-border-default)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <Gift className="h-4 w-4" aria-hidden="true" />
          Add a gift note
        </button>
      ) : (
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.NoteUpdate}
          inputs={{note}}
        >
          {(fetcher) => (
            <div className="rounded-md border border-[var(--color-border-default)] bg-[var(--surface-card)] p-3">
              <label
                htmlFor={textareaId}
                className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-[var(--text-subtle)]"
              >
                <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                Gift note
              </label>
              <textarea
                id={textareaId}
                name="note"
                rows={3}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a short message to include with the order."
                className="w-full rounded-md border border-[var(--color-border-default)] bg-[var(--surface-page)] px-3 py-2 text-sm focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--text-subtle)]">
                  {note.length} / 500
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNote('');
                      setOpen(false);
                    }}
                    className="rounded-md border border-[var(--color-border-default)] px-3 py-1 text-xs hover:bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={fetcher.state !== 'idle'}
                    className="rounded-md bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {fetcher.state === 'idle' ? 'Save note' : 'Saving…'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </CartForm>
      )}
    </section>
  );
}
