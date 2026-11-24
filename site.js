const deck = document.querySelector('#deck');
const previous = document.querySelector('#prev');
const next = document.querySelector('#next');
const number = document.querySelector('#page-number');
function sync(event) {
  if (event.source !== deck.contentWindow || event.origin !== location.origin || event.data?.type !== 'ppt-demo-page') return;
  const { page, total } = event.data;
  if (!Number.isInteger(page) || total !== 2 || page < 1 || page > total) return;
  number.textContent = [page, total].map(value => String(value).padStart(2, '0')).join(' / ');
  previous.disabled = page === 1;
  next.disabled = page === total;
}
window.addEventListener('message', sync);
function navigate(key) {
  deck.contentWindow.postMessage({ type: 'ppt-demo-navigate', key }, location.origin);
}
previous.addEventListener('click', () => navigate('ArrowLeft'));
next.addEventListener('click', () => navigate('ArrowRight'));
