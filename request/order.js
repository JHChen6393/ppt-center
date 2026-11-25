'use strict';
const form = document.querySelector('#request-form');
const send = document.querySelector('#send');
const pages = form.elements.pages;
const feedback = document.querySelector('#feedback');
const receipt = document.querySelector('#receipt');
const languageLinks = [...document.querySelectorAll('[data-language]')];
const translated = [...document.querySelectorAll('[data-en]')].map(node => [node, node.textContent]);
const placeholders = [...document.querySelectorAll('[data-placeholder-en]')].map(node => [node, node.placeholder]);
const relay = '186cbfb12df14a5571eda8a9aa4ac7ec';
const endpoint = 'https://formsubmit.co/ajax/' + relay;
const messages = {
  'zh-CN': {
    empty: '请填写演示材料。',
    sending: '正在提交…',
    failed: '这次没能提交，请稍后再试。你填写的内容还在。',
    uncertain: '暂时无法确认是否提交成功。你填写的内容还在，可以稍后再试。',
  },
  en: {
    empty: 'Please add some material for your presentation.',
    sending: 'Sending your request…',
    failed: 'We couldn’t send your request. Your entries are still here. Please try again later.',
    uncertain: 'We couldn’t confirm your request. Your entries are still here if you need to try again.',
  },
};
let language;
let feedbackKey;
let previous;

for (let count = 1; count <= 5; count++) pages.add(new Option('', count));
pages.value = '3';

function showFeedback(key) {
  feedbackKey = key;
  feedback.textContent = messages[language][key] ?? '';
}

function setLanguage(next) {
  language = next;
  const english = language === 'en';
  document.documentElement.lang = language;
  document.title = english ? 'Try Yexu' : '申请试用 · 页序';
  document.querySelector('#home-link').setAttribute('aria-label', english ? 'Yexu homepage' : '页序首页');
  document.querySelector('#language-nav').setAttribute('aria-label', english ? 'Language' : '语言');
  for (const [node, chinese] of translated) node.textContent = english ? node.dataset.en : chinese;
  for (const [node, chinese] of placeholders) node.placeholder = english ? node.dataset.placeholderEn : chinese;
  for (const option of pages.options) {
    const count = Number(option.value);
    option.textContent = english ? count + (count === 1 ? ' slide' : ' slides') : count + ' 页';
  }
  for (const link of languageLinks) {
    if (link.dataset.language === language) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  showFeedback(feedbackKey);
}

setLanguage(new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh-CN');
for (const link of languageLinks) {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = new URL(location.href);
    const next = link.dataset.language;
    if (next === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
    setLanguage(next);
  });
}
send.disabled = false;

form.addEventListener('submit', async event => {
  event.preventDefault();
  const material = form.elements.material.value.trim();
  if (!material) {
    showFeedback('empty');
    return;
  }
  const order = {
    email: form.elements.email.value.trim(),
    total_pages: Number(pages.value),
    material,
  };
  const serialized = JSON.stringify(order);
  if (previous?.serialized !== serialized) {
    previous = { serialized, id: 'YX-' + crypto.randomUUID().replaceAll('-', '') };
  }
  const id = previous.id;
  send.disabled = true;
  showFeedback('sending');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _subject: '页序试用 ' + id,
        _replyto: order.email,
        _honey: form.elements.company.value,
        _url: location.origin + location.pathname,
        order_id: id,
        language,
        ...order,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok || (result?.success !== true && result?.success !== 'true')) {
      showFeedback('failed');
      send.disabled = false;
      return;
    }
    form.hidden = true;
    receipt.hidden = false;
    receipt.focus();
  } catch {
    showFeedback('uncertain');
    send.disabled = false;
  }
});
