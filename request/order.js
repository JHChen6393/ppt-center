'use strict';
const form = document.querySelector('#request-form');
const send = document.querySelector('#send');
const pages = form.elements.pages;
const quote = document.querySelector('#quote');
const timing = document.querySelector('#timing');
const feedback = document.querySelector('#feedback');
let terms;

function updateQuote() {
  const count = Number(pages.value);
  const pricing = terms.prices[form.elements.market.value];
  const amount = pricing.price_per_page_minor * count / 100;
  const format = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: pricing.currency, currencyDisplay: 'narrowSymbol' });
  quote.textContent = '预计报价 ' + (pricing.currency === 'USD' ? 'US' : '') + format.format(amount);
  timing.textContent = '预计 ' + terms.hours[count].join('–') + ' 小时';
}

const pricingTerms = { prices: { CN: { currency: 'CNY', price_per_page_minor: 200 }, INTL: { currency: 'USD', price_per_page_minor: 30 } }, hours: { 1:[1,2], 2:[1,3], 3:[2,3], 4:[2,4], 5:[3,5] } };
const relay = '186cbfb12df14a5571eda8a9aa4ac7ec';
const endpoint = 'https://formsubmit.co/ajax/' + relay;
terms = pricingTerms;
for (const count of Object.keys(terms.hours)) pages.add(new Option(count + ' 页', count));
pages.value = '3';
updateQuote();
send.disabled = false;
pages.addEventListener('change', updateQuote);
form.elements.market.addEventListener('change', updateQuote);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const material = form.elements.material.value.trim();
  if (!material) {
    feedback.textContent = '请填写演示材料。';
    return;
  }
  send.disabled = true;
  feedback.textContent = '正在提交…';
  const id = 'YX-' + crypto.randomUUID().replaceAll('-', '');
  const count = Number(pages.value);
  const market = form.elements.market.value;
  const price = terms.prices[market];
  const email = form.elements.email.value.trim();
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _subject: '页序试用 ' + id,
        _replyto: email,
        _honey: form.elements.company.value,
        _url: location.origin + location.pathname,
        email,
        order_id: id,
        market,
        total_pages: count,
        quoted_currency: price.currency,
        quoted_amount: (price.price_per_page_minor * count / 100).toFixed(2),
        material,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok || (result?.success !== true && result?.success !== 'true')) {
      if (response.ok && (result?.success === false || result?.success === 'false')) {
        feedback.textContent = '暂时无法接收这条需求。请保留单号 ' + id + '，稍后再试。';
        send.disabled = false;
        return;
      }
      throw Error('Uncertain submission result');
    }
    document.querySelector('#reference').textContent = id;
    document.querySelector('#receipt-detail').textContent = '需求已提交给页序。请保留单号，后续联系会发到你填写的邮箱。';
    form.hidden = true;
    const receipt = document.querySelector('#receipt');
    receipt.hidden = false;
    receipt.focus();
  } catch {
    feedback.textContent = '提交结果未确认。请保留单号 ' + id + '，以便核对。';
    send.disabled = false;
  }
});
document.querySelector('#copy').addEventListener('click', async () => {
  const reference = document.querySelector('#reference');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(reference.textContent);
    status.textContent = '单号已复制';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(reference);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = '已选中单号，可以手动复制。';
  }
});
