import {ui} from '../../content/recovery-ui';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import {Link} from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowUpRight, Minus, Plus, X, ShoppingBag} from 'lucide-react';
import {products} from '../../content/recovery';
import {money, recoverySettings} from '../../config/recovery';
import {parseBag, updateBag, bagSubtotal, type BagLine} from './commerce';
interface BagContextValue {
  lines: BagLine[];
  setQuantity: (id: string, option: string, q: number) => void;
  add: (id: string, option: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  storageError: boolean;
  restoreFocus: () => void;
}
const BagContext = createContext<BagContextValue | null>(null);
export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error('Bag provider missing');
  return ctx;
}
export function BagProvider({children}: {children: ReactNode}) {
  // Keep server output and the first browser render identical. Storage is read
  // in an effect, and persistence stays disabled until that read completes.
  const [lines, setLines] = useState<BagLine[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [open, updateOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const setOpen = (value: boolean) => {
    if (
      value &&
      !open &&
      typeof document !== 'undefined' &&
      typeof HTMLElement !== 'undefined' &&
      document.activeElement instanceof HTMLElement
    ) {
      opener.current = document.activeElement;
    }
    updateOpen(value);
  };
  const restoreFocus = () => {
    if (typeof document === 'undefined') return;
    const target = opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>('[data-bag-trigger]');
    target?.focus();
  };
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    let storageRead = false;
    try {
      setLines(parseBag(window.localStorage.getItem(recoverySettings.storageKey)));
      setStorageError(false);
      storageRead = true;
    } catch {
      setStorageError(true);
    }
    setStorageReady(storageRead);
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(recoverySettings.storageKey, JSON.stringify(lines));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [lines, storageReady]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === recoverySettings.storageKey) setLines(parseBag(e.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const setQuantity = (id: string, option: string, q: number) =>
    setLines((current) => updateBag(current, id, option, q));
  const add = (id: string, option: string) => {
    setLines((current) =>
      updateBag(
        current,
        id,
        option,
        (current.find((l) => l.id === id && l.option === option)?.quantity ??
          0) + 1,
      ),
    );
    setOpen(true);
  };
  return (
    <BagContext.Provider
      value={{lines, setQuantity, add, open, setOpen, storageError, restoreFocus}}
    >
      {children}
      <BagDrawer />
    </BagContext.Provider>
  );
}
export function BagContents() {
  const {lines, setQuantity, setOpen, storageError} = useBag();
  const [checkout, setCheckout] = useState(false);
  if (!lines.length)
    return (
      <div className="empty-bag">
        <ShoppingBag size={40} strokeWidth={1} />
        <h2>{ui.a_little_room_for_you_8a2727}</h2>
        <p>{ui.your_bag_is_empty_find_something_for_your_eve_6d1be3}</p>
        <Link
          className="button"
          to="/collections/all"
          onClick={() => setOpen(false)}
        >
          {ui.explore_the_collection_9d5be0}
          <ArrowUpRight size={18} />
        </Link>
      </div>
    );
  return (
    <>
      <ul className="bag-lines">
        {lines.map((line) => {
          const p = products.find((item) => item.id === line.id)!;
          return (
            <li key={`${line.id}-${line.option}`}>
              <Link to={`/products/${p.id}`} onClick={() => setOpen(false)}>
                <img src={p.image} alt={p.name} />
              </Link>
              <div>
                <Link to={`/products/${p.id}`} onClick={() => setOpen(false)}>
                  {p.name}
                </Link>
                <p>{line.option}</p>
                <div className="quantity">
                  <button
                    aria-label={`Decrease ${p.name} ${line.option}`}
                    disabled={line.quantity <= 1}
                    onClick={() =>
                      setQuantity(line.id, line.option, line.quantity - 1)
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <span aria-label={ui.quantity_822bab}>{line.quantity}</span>
                  <button
                    aria-label={`Increase ${p.name} ${line.option}`}
                    disabled={line.quantity >= recoverySettings.maxQuantity}
                    onClick={() =>
                      setQuantity(line.id, line.option, line.quantity + 1)
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  className="text-button muted"
                  onClick={() => setQuantity(line.id, line.option, 0)}
                >
                  {ui.remove_594895}
                  {p.name}
                </button>
              </div>
              <strong>{money(p.price * line.quantity)}</strong>
            </li>
          );
        })}
      </ul>
      <div className="bag-total">
        <span>{ui.subtotal_8c0f2c}</span>
        <strong>{money(bagSubtotal(lines))}</strong>
      </div>
      <p className="small muted">
        {ui.example_prices_in_usd_no_shipping_or_taxes_ar_16ad3f}
      </p>
      {storageError && (
        <p role="status">
          {ui.browser_storage_is_unavailable_your_bag_will__07c2e4}
        </p>
      )}
      <button className="button full" onClick={() => setCheckout(true)}>
        {ui.preview_checkout_3552ac}
        <ArrowUpRight size={18} />
      </button>
      {checkout && (
        <div className="demo-notice" role="status">
          <strong>{ui.you_re_exploring_a_concept_store_d087fd}</strong>
          <p>{ui.checkout_is_not_connected_no_payment_is_colle_5d6e3e}</p>
        </div>
      )}
    </>
  );
}
function BagDrawer() {
  const {open, setOpen, lines, restoreFocus} = useBag();
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="drawer bag-drawer"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            restoreFocus();
          }}
        >
          <div className="drawer-heading">
            <Dialog.Title>
              {ui.your_bag_ef87a0}{' '}
              <span>
                {ui._32ebb1}
                {lines.reduce((n, l) => n + l.quantity, 0)}
                {ui._ba5ec5}
              </span>
            </Dialog.Title>
            <Dialog.Close
              className="icon-button"
              aria-label={ui.close_bag_d20c56}
            >
              <X />
            </Dialog.Close>
          </div>
          <Dialog.Description className="small muted">
            {ui.your_everyday_recovery_collection_local_demo_fb60f1}
          </Dialog.Description>
          <BagContents />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
