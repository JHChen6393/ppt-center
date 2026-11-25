'use strict';
const form = document.querySelector('#request-form');
const send = document.querySelector('#send');
const pages = form.elements.pages;
const feedback = document.querySelector('#feedback');
const receipt = document.querySelector('#receipt');
const methods = { wechat: '微信支付', alipay: '支付宝', paypal: 'PayPal' };
const relay = '186cbfb12df14a5571eda8a9aa4ac7ec';
const endpoint = 'https://formsubmit.co/ajax/' + relay;

for (let count = 1; count <= 5; count++) pages.add(new Option(count + ' 页', count));
pages.value = '3';
send.disabled = false;
let previous;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const material = form.elements.material.value.trim();
  if (!material) {
    feedback.textContent = '请填写演示材料。';
    return;
  }
  const order = {
    email: form.elements.email.value.trim(),
    total_pages: Number(pages.value),
    preferred_payment: methods[form.elements.payment.value] ?? '',
    material,
  };
  const serialized = JSON.stringify(order);
  if (previous?.serialized !== serialized) {
    previous = { serialized, id: 'YX-' + crypto.randomUUID().replaceAll('-', '') };
  }
  const id = previous.id;
  send.disabled = true;
  feedback.textContent = '正在提交…';
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
        ...order,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok || (result?.success !== true && result?.success !== 'true')) {
      feedback.textContent = '这次没能提交，请稍后再试。你填写的内容还在。';
      send.disabled = false;
      return;
    }
    form.hidden = true;
    receipt.hidden = false;
    receipt.focus();
  } catch {
    feedback.textContent = '暂时无法确认是否提交成功。你填写的内容还在，可以稍后再试。';
    send.disabled = false;
  }
});
