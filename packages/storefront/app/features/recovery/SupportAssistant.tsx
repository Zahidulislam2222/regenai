import {useEffect, useRef, useState, type FormEvent} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowUpRight, MessageCircle, Send, X} from 'lucide-react';
import {recoverySettings} from '../../config/recovery';
import {ui} from '../../content/recovery-ui';

type Message = {id: string; role: 'user' | 'assistant'; text: string};
const config = recoverySettings.assistant;

/** Same-origin chat, with the session and credentials owned by the Python service. */
export function SupportAssistant() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState<number>();
  const active = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {log.current?.scrollTo({top: log.current.scrollHeight});}, [messages, busy]);

  async function request(path: string, method: 'GET' | 'POST', payload?: object) {
    const controller = new AbortController();
    active.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      const response = await fetch(config.basePath + path, {
        method, credentials: 'same-origin', signal: controller.signal,
        headers: method === 'POST' ? {'Content-Type': 'application/json'} : {},
        ...(payload ? {body: JSON.stringify(payload)} : {}),
      });
      if (!response.ok) throw new Error(ui.assistant_unavailable);
      return await response.json() as Record<string, unknown>;
    } finally {
      window.clearTimeout(timeout);
      if (active.current === controller) active.current = null;
    }
  }

  async function initialize() {
    setBusy(true); setError('');
    try {
      await request('/api/session', 'POST');
      const settings = await request('/api/config', 'GET');
      const workspace = await request('/api/workspace', 'GET');
      const history = workspace.messages;
      if (Array.isArray(history)) {
        setMessages(history.filter((item: unknown): item is Message =>
          typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string' && 'role' in item && 'text' in item &&
          (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string')
          .slice(-config.maxVisibleMessages));
      }
      if (typeof settings.message_max_chars === 'number') setLimit(settings.message_max_chars);
      setReady(true);
    } catch {setError(ui.assistant_unavailable);} finally {setBusy(false);}
  }

  function changeOpen(value: boolean) {
    setOpen(value);
    if (value && !ready && !busy) void initialize();
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy || !ready) return;
    setBusy(true); setError('');
    try {
      const result = await request('/api/chat', 'POST', {message: text});
      if (typeof result.answer !== 'string') throw new Error(ui.assistant_unavailable);
      const incoming: Message[] = [{id: crypto.randomUUID(), role: 'user', text},
        {id: crypto.randomUUID(), role: 'assistant', text: result.answer}];
      setMessages((previous) => [...previous, ...incoming].slice(-config.maxVisibleMessages));
      setMessage('');
    } catch {setError(ui.assistant_unavailable);} finally {setBusy(false);}
  }

  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger className="support-launcher">
      <MessageCircle size={19} aria-hidden="true" />{ui.assistant_label}
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="support-panel">
        <div className="support-heading">
          <div><p className="eyebrow">{ui.assistant_eyebrow}</p>
            <Dialog.Title>{ui.assistant_title}</Dialog.Title></div>
          <Dialog.Close className="icon-button" aria-label={ui.assistant_close}><X /></Dialog.Close>
        </div>
        <Dialog.Description className="support-intro">{ui.assistant_intro}</Dialog.Description>
        <div ref={log} className="support-messages" role="log" aria-live="polite"
          aria-label={ui.assistant_conversation}>
          {!messages.length && <p className="support-welcome">{ui.assistant_welcome}</p>}
          {messages.map((item) => <div className={`support-message ${item.role}`} key={item.id}>
            <span className="eyebrow">{item.role === 'user' ? ui.assistant_you : ui.assistant_label}</span>
            <p>{item.text}</p>
          </div>)}
          {busy && <p className="small muted" role="status">{ui.assistant_thinking}</p>}
        </div>
        {error && <div className="support-error" role="alert"><p>{error}</p>
          {!ready && <button className="text-link" onClick={() => void initialize()} disabled={busy}>
            {ui.assistant_retry}</button>}</div>}
        <form className="support-compose" onSubmit={(event) => void send(event)}>
          <label className="sr-only" htmlFor="support-message">{ui.assistant_message}</label>
          <input id="support-message" value={message} onChange={(event) => setMessage(event.target.value)}
            placeholder={ui.assistant_placeholder} maxLength={limit} disabled={!ready || busy} />
          <button type="submit" disabled={!ready || busy || !message.trim()}
            aria-label={ui.assistant_send}><Send size={19} /></button>
        </form>
        <a className="support-studio-link" href={config.basePath}>
          {ui.assistant_studio}<ArrowUpRight size={16} /></a>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
