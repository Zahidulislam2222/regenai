'use strict';
const base = document.querySelector('meta[name="assistant-base"]').content;
const $ = (selector) => document.querySelector(selector);
let labels;
let ui = {};
let workspace;
let config;
let latestReply = '';

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = String(text);
  if (className) element.className = className;
  return element;
}
function notify(message, error = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('error', error);
  toast.hidden = false;
}
async function api(path, method = 'GET', data) {
  const response = await fetch(base + '/api/' + path, {method, credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:data === undefined ? undefined : JSON.stringify(data)});
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : response.statusText);
  return result;
}
async function busy(button, action) {
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try {await action();} catch (error) {notify(error.message, true);} finally {button.disabled = false; button.removeAttribute('aria-busy');}
}
function actionButton(text, action, style = 'secondary') {
  const button = node('button', text, 'button ' + style);
  button.type = 'button';
  button.addEventListener('click', () => busy(button, action));
  return button;
}
function download(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const link = node('a'); link.href = url; link.download = name; link.click();
  URL.revokeObjectURL(url);
}
function panel(name) {
  document.querySelectorAll('.panel').forEach((element) => {element.hidden = element.id !== 'panel-' + name;});
  document.querySelectorAll('.nav').forEach((element) => {
    const active = element.dataset.panel === name;
    element.classList.toggle('active', active);
    if (active) element.setAttribute('aria-current','page'); else element.removeAttribute('aria-current');
  });
  $('#current-page').textContent = labels?.[name] || document.querySelector('.nav.active').textContent;
  $('#main').focus({preventScroll:true});
}
function renderTickets() {
  const list = $('#ticket-list'); list.replaceChildren();
  if (!workspace.tickets.length) list.append(node('p',ui.text_2,'muted'));
  for (const ticket of workspace.tickets) {
    const card = node('article', undefined, 'ticket');
    const heading = node('div', undefined, 'ticket-heading');
    const intro = node('div');
    intro.append(node('h3', ticket.subject), node('div', ticket.customer + ' · Order #' + ticket.order_number + ' · ' + (config.ui.channels[ticket.channel] || ticket.channel) + ' · ' + ticket.language, 'ticket-meta'));
    heading.append(intro, node('span', ticket.state.replaceAll('_',' '), 'tag tag-' + ticket.state));
    card.append(heading, node('p', ticket.body, 'ticket-body'));
    if (ticket.recommendation) {
      const rec = ticket.recommendation;
      const recommendation = node('div', undefined, 'recommendation');
      const order = workspace.orders.find((value) => value.id === ticket.order_id);
      let resolution = rec.action;
      if (rec.amount_cents && order) resolution += ' ' + new Intl.NumberFormat(undefined,{style:'currency',currency:order.currency}).format(rec.amount_cents / 100);
      recommendation.append(node('strong', ui.text_3 + resolution), node('p', rec.reason), node('p', ui.text_4 + rec.reply), node('small', ui.text_5 + (ticket.recommendation_source === 'claude' ? ui.text_6 : 'deterministic policy check') + ' · policy v' + ticket.rulebook_version));
      card.append(recommendation);
    }
    if (ticket.execution) card.append(node('p', ticket.execution.mode === 'simulation' ? ui.text_7 : ui.text_8, 'execution'));
    const actions = node('div', undefined, 'ticket-actions');
    if (['new','rejected','awaiting_approval','handoff'].includes(ticket.state)) {
      actions.append(actionButton(ui.text_9, async () => {await api('tickets/' + encodeURIComponent(ticket.id) + '/recommend','POST',{use_ai:false}); await refresh(); notify(ui.text_10);}));
      if (config.ai_available) actions.append(actionButton(ui.text_11, async () => {await api('tickets/' + encodeURIComponent(ticket.id) + '/recommend','POST',{use_ai:true}); await refresh(); notify(ui.text_12);}));
    }
    if (ticket.state === 'awaiting_approval') {
      actions.append(actionButton(ticket.synthetic ? ui.text_13 : ui.text_14, async () => {
        if (!ticket.synthetic && !confirm(ui.text_15)) return;
        await api('tickets/' + encodeURIComponent(ticket.id) + '/decision','POST',{decision:'approve',version:ticket.version}); await refresh(); notify(ticket.synthetic ? ui.text_16 : ui.text_17);
      },'primary'));
      actions.append(actionButton('Reject', async () => {await api('tickets/' + encodeURIComponent(ticket.id) + '/decision','POST',{decision:'reject',version:ticket.version}); await refresh(); notify(ui.text_18);},'danger'));
    }
    actions.append(actionButton(ui.text_19, async () => {download('support-handoff.json',await api('tickets/' + encodeURIComponent(ticket.id) + '/handoff')); notify(ui.text_20);},'quiet'));
    card.append(actions); list.append(card);
  }
}
function renderChat() {
  const list = $('#messages'); list.replaceChildren();
  if (!workspace.messages.length) list.append(node('div',ui.text_21,'empty-chat'));
  for (const message of workspace.messages) {
    const card = node('div',undefined,'message message-' + message.role);
    card.append(node('span',message.role === 'user' ? ui.text_22 : ui.text_23,'message-label'), node('span',message.text));
    list.append(card);
  }
  list.scrollTop = list.scrollHeight;
}
function renderRulebook() {
  const form = $('#rulebook-form');
  const rules = workspace.rulebook;
  for (const key of ['store_name','voice','refund_window_days','max_refund_cents','confidence_threshold','policies']) form.elements[key].value = rules[key];
  form.elements.refund_reasons.value = rules.refund_reasons.join(', ');
  form.elements.handoff_terms.value = rules.handoff_terms.join(', ');
  $('#rulebook-version').textContent = ui.text_24 + rules.version;
}
function renderJobs() {
  const list = $('#job-list'); list.replaceChildren(node('h2',ui.text_25));
  if (!workspace.jobs.length) list.append(node('p',ui.text_26,'muted'));
  for (const job of workspace.jobs) {
    const row = node('div',undefined,'timeline-row');
    row.append(node('strong',job.kind.replaceAll('_',' ') + ' · ' + job.state), node('small',ui.text_27 + new Date(job.due * 1000).toLocaleString() + (job.interval_seconds ? ' · repeats every ' + job.interval_seconds + 's' : '')));
    if (job.error) row.append(node('span',job.error));
    if (['pending','running'].includes(job.state)) row.append(actionButton(ui.text_28,async () => {await api('jobs/'+encodeURIComponent(job.id),'DELETE');await refresh();notify(ui.text_29);},'quiet'));
    list.append(row);
  }
}
function renderConnections() {
  const list = $('#connection-list'); list.replaceChildren();
  const form = $('#connection-form');
  const isOwner = workspace.role === 'owner';
  form.hidden = !isOwner; $('#connection-access').hidden = isOwner;
  if (!form.elements.oauth_grant_type) {
    const label = node('label', config.ui.connection_auth.label);
    const select = node('select'); select.name = 'oauth_grant_type';
    for (const [value, text] of Object.entries(config.ui.connection_auth.grants)) {
      const option = node('option', text); option.value = value; select.append(option);
    }
    label.append(select); form.querySelector('[type=submit]').before(label);
  }
  form.elements.provider.replaceChildren();
  if (!isOwner) return;
  for (const connection of workspace.connections) {
    const option = node('option',connection.label); option.value = connection.provider; form.elements.provider.append(option);
    const card = node('article',undefined,'connection');
    card.append(node('h3',connection.label), node('span',connection.configured ? ui.text_30 : ui.text_31,'tag'), node('p',connection.status));
    const docs = node('a',ui.text_32); docs.href = connection.docs; docs.target = '_blank'; docs.rel = 'noopener noreferrer'; card.append(docs);
    if (connection.configured) {
      card.append(actionButton(ui.text_33, async () => {const result = await api('connections/' + connection.provider + '/check','POST',{}); await refresh(); notify(result.status);}));
      if (connection.provider !== 'shopify') card.append(actionButton(ui.text_34, async () => {const result = await api('connections/' + connection.provider + '/read','POST',{}); $('#connection-result').textContent = JSON.stringify(result.data,null,2); $('#connection-result').hidden = false;},'quiet'));
    }
    list.append(card);
  }
}
function renderActivity() {
  const list = $('#audit-list'); list.replaceChildren();
  for (const event of workspace.audit) {
    const row = node('div',undefined,'timeline-row');
    row.append(node('strong',event.event.replaceAll('_',' ')),node('small',new Date(event.time * 1000).toLocaleString()),node('span',event.detail?.ticket ? (workspace.tickets.find(ticket => ticket.id === event.detail.ticket)?.subject || ui.text_63) : event.detail?.provider ? (config.ui.channels[event.detail.provider] || event.detail.provider) : event.detail?.error || ui.text_64));
    list.append(row);
  }
  const setup = $('#setup-list'); setup.replaceChildren(node('h2',ui.text_35));
  if (!workspace.setup.length) setup.append(node('p',ui.text_36,'muted'));
  for (const entry of workspace.setup) {const row=node('div',undefined,'timeline-row'); row.append(node('strong',entry.step),node('p',entry.note),node('small',new Date(entry.time * 1000).toLocaleString()));setup.append(row);}
  const budget = $('#budget-card'); budget.hidden = !workspace.budget;
  if (workspace.budget) budget.textContent = ui.text_37 + workspace.budget.total + ' · daily cap $' + workspace.budget.daily_cap + ' · service total cap $' + workspace.budget.total_cap + '. Pending or uncertain charges remain reserved.';
}
async function refresh() {
  workspace = await api('workspace');
  $('#session-role').textContent = workspace.role === 'owner' ? ui.text_38 : ui.text_39;
  $('#owner-login').hidden = workspace.role === 'owner'; $('#sign-out').hidden = workspace.role !== 'owner';
  $('#ticket-count').textContent = workspace.tickets.length;
  $('#metric-review').textContent = workspace.tickets.filter((t) => ['new','awaiting_approval'].includes(t.state)).length;
  $('#metric-handoff').textContent = workspace.tickets.filter((t) => ['handoff','needs_reconciliation'].includes(t.state)).length;
  $('#metric-completed').textContent = workspace.tickets.filter((t) => t.state === 'completed').length;
  $('#metric-ai').textContent = config.ai_available ? ui.text_6 : ui.text_40;
  $('#ai-status').textContent = config.ai_available ? ui.text_41 : ui.text_42;
  $('#memory-text').value=workspace.memory; renderTickets(); renderChat(); renderRulebook(); renderJobs(); renderConnections(); renderActivity();
}
document.querySelectorAll('.nav').forEach((button) => button.addEventListener('click', () => panel(button.dataset.panel)));
$('#refresh').addEventListener('click', (event) => busy(event.currentTarget, refresh));
$('#owner-login').addEventListener('click', () => $('#login-dialog').showModal());
$('#close-login').addEventListener('click', () => $('#login-dialog').close());
$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const form=event.currentTarget;
  try {await api('login','POST',{password:form.elements.password.value}); form.reset(); $('#login-dialog').close(); await refresh(); notify(ui.text_43);} catch(error){$('#login-error').textContent=error.message;}
});
$('#sign-out').addEventListener('click', (event) => busy(event.currentTarget, async () => {await api('logout','POST',{}); await api('session','POST',{}); await refresh(); notify(ui.text_44);}));
$('#ticket-form').addEventListener('submit', (event) => {event.preventDefault(); const form=event.currentTarget; busy(form.querySelector('[type=submit]'),async () => {await api('tickets','POST',Object.fromEntries(new FormData(form))); form.reset(); await refresh(); notify(ui.text_45);});});
function readImage(file) {return new Promise((resolve,reject) => {const reader = new FileReader(); reader.onload=() => resolve(reader.result);reader.onerror=() => reject(new Error(ui.text_46)); reader.readAsDataURL(file);});}
$('#chat-image').addEventListener('change', (event) => {$('#attachment-name').textContent=event.target.files[0]?.name || '';});
$('#chat-form').addEventListener('submit', (event) => {
  event.preventDefault(); const form=event.currentTarget;
  busy($('#chat-send'),async () => {
    const payload = {message:$('#chat-message').value}; const file=$('#chat-image').files[0];
    if (file) {if (file.size > config.image_max_bytes) throw new Error(ui.text_47); payload.image=await readImage(file);}
    const speak=$('#speak-replies').checked; const language=$('#voice-language').value;
    const result=await api('chat','POST',payload); latestReply=result.answer; form.reset(); $('#speak-replies').checked=speak; $('#voice-language').value=language; $('#attachment-name').textContent=''; await refresh();
    if (speak && 'speechSynthesis' in window) {window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(latestReply);utterance.lang=language;window.speechSynthesis.speak(utterance);}
  });
});
$('#erase-memory').addEventListener('click',(event) => busy(event.currentTarget,async () => {await api('memory','DELETE');await refresh();notify(ui.text_48);}));
$('#memory-form').addEventListener('submit',(event) => {event.preventDefault();busy(event.currentTarget.querySelector('[type=submit]'),async () => {await api('memory','PUT',{text:$('#memory-text').value});await refresh();notify(ui.text_49);});});
$('#rulebook-form').addEventListener('submit',(event) => {
  event.preventDefault(); const form=event.currentTarget;
  busy(form.querySelector('[type=submit]'),async () => {
    const rulebook=Object.fromEntries(new FormData(form));
    for(const key of ['refund_window_days','max_refund_cents','confidence_threshold'])rulebook[key]=Number(rulebook[key]);
    for(const key of ['refund_reasons','handoff_terms'])rulebook[key]=rulebook[key].split(',').map((s)=>s.trim()).filter(Boolean);
    await api('rulebook','PUT',{rulebook,version:workspace.rulebook.version});await refresh();notify(ui.text_50);
  });
});
$('#draft-form').addEventListener('submit',(event) => {event.preventDefault();const form=event.currentTarget;busy(form.querySelector('[type=submit]'),async () => {const result=await api('rulebook/draft','POST',{examples:form.elements.examples.value});$('#draft-result').textContent=JSON.stringify(result.draft,null,2);$('#draft-result').hidden=false;notify(ui.text_51);});});
$('#job-form').addEventListener('submit',(event) => {event.preventDefault();const form=event.currentTarget;busy(form.querySelector('[type=submit]'),async () => {const payload=Object.fromEntries(new FormData(form));payload.delay_seconds=Number(payload.delay_seconds);payload.interval_seconds=Number(payload.interval_seconds);await api('jobs','POST',payload);await refresh();notify(ui.text_52);});});
$('#setup-form').addEventListener('submit',(event) => {event.preventDefault();const form=event.currentTarget;busy(form.querySelector('[type=submit]'),async () => {await api('setup','POST',Object.fromEntries(new FormData(form)));form.reset();await refresh();notify(ui.text_53);});});
$('#connection-form').addEventListener('submit',(event) => {event.preventDefault();const form=event.currentTarget;busy(form.querySelector('[type=submit]'),async () => {const payload=Object.fromEntries(new FormData(form));payload.expires_at=Number(payload.expires_at);await api('connections','POST',payload);form.reset();await refresh();notify(ui.text_54);});});
$('#export-workspace').addEventListener('click',(event) => busy(event.currentTarget,async () => {download('regenai-workspace-record.json',await api('export'));notify(ui.text_55);}));
$('#web-form').addEventListener('submit',(event) => {event.preventDefault();const form=event.currentTarget;busy(form.querySelector('[type=submit]'),async () => {const result=await api('web','POST',{url:form.elements.url.value});$('#web-result').textContent=result.text;$('#web-result').hidden=false;notify(ui.text_56);});});
const Recognition=window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {$('#voice-input').addEventListener('click',() => {const recognition=new Recognition();recognition.lang=$('#voice-language').value;recognition.onresult=(event) => {$('#chat-message').value=event.results[0][0].transcript;$('#chat-message').focus();};recognition.onerror=() => notify(ui.text_57,true);recognition.start();});} else {$('#voice-input').disabled=true;$('#voice-input').textContent=ui.text_58;}
async function start() {
  try {
    config=await api('config');ui=config.ui.text;labels=config.ui.panels;$('#disclosure').textContent=config.disclosure;$('#chat-message').maxLength=config.message_max_chars;$('#memory-text').maxLength=config.memory_max_chars;$('#web-sources').textContent=ui.text_59 + config.web_sources.join(', ');
    await api('session','POST',{});await refresh();
    const health=await fetch(base + '/health').then((response)=>response.json());$('#service-status').textContent=health.worker === 'running' ? ui.text_60 : ui.text_61;
  } catch(error) {notify(error.message,true);$('#service-status').textContent=error.message;}
}
start();
