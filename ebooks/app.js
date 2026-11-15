'use strict';

const byId = (id) => document.getElementById(id);
const pageUrl = (book, number) =>
  './assets/' + book.id + '/' + String(number).padStart(2, '0') + '.webp';
const catalog = window.EBOOK_CATALOG;
const query = new URLSearchParams(location.search);
const book = catalog.find(({id}) => id === query.get('book'));

function renderShelf() {
  for (const item of catalog) {
    const card = document.createElement('a');
    card.className = 'book';
    card.href = '?book=' + encodeURIComponent(item.id);
    const cover = new Image();
    cover.src = pageUrl(item, 1);
    cover.alt = '';
    const info = document.createElement('div');
    for (const [tag, css, value] of [
      ['span', 'eyebrow', '발간 제' + item.number + '호'],
      ['h2', '', item.title],
      ['span', 'meta', item.date + ' · ' + item.pages + '쪽'],
      ['span', 'open', '공개 소개판 읽기 →']
    ]) {
      const element = document.createElement(tag);
      element.className = css;
      element.textContent = value;
      info.append(element);
    }
    card.append(cover, info);
    byId('books').append(card);
  }
}

function renderReader(item) {
  const reader = byId('reader');
  const stage = byId('stage');
  const sheet = byId('sheet');
  const image = byId('page');
  const target = byId('page-number');
  const previous = byId('prev');
  const next = byId('next');
  const full = byId('fullscreen');
  const toc = byId('toc');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let page = 0;
  let zoom = 100;
  let touchStart;
  let animation;

  byId('shelf').hidden = true;
  reader.hidden = false;
  document.body.classList.add('reading');
  byId('book-title').textContent = item.title;
  document.title = item.title + ' | 전자책 도서관';
  target.max = item.pages;
  byId('count').textContent = '/ ' + item.pages;
  for (const [level, label, number] of item.contents) {
    toc.add(new Option((level > 1 ? '　' : '') + label, number));
  }

  function resize() {
    const style = getComputedStyle(stage);
    const width = stage.clientWidth - 2 * parseFloat(style.paddingLeft);
    const height = stage.clientHeight - 2 * parseFloat(style.paddingTop);
    if (!width || !height) return;
    const fitted = stage.clientWidth < 640 ? width : Math.min(width, height * 595.32 / 841.92);
    sheet.style.setProperty('--page-width', Math.max(1, fitted) * zoom / 100 + 'px');
  }

  function show(number, animate = true) {
    if (!Number.isInteger(number) || number < 1 || number > item.pages || number === page) {
      target.value = page;
      return;
    }
    const direction = Math.sign(number - page);
    animation?.cancel();
    page = number;
    image.src = pageUrl(item, page);
    image.alt = '발간 제' + item.number + '호 ' + page + '쪽';
    target.value = page;
    previous.disabled = page === 1;
    next.disabled = page === item.pages;
    byId('status').textContent = page + ' / ' + item.pages + '쪽';
    stage.scrollTo(0, 0);
    if (animate && !reducedMotion.matches && typeof sheet.animate === 'function') {
      animation = sheet.animate(
        [{transform: 'rotateY(' + (-24 * direction) + 'deg)', opacity: 0.6},
         {transform: 'rotateY(0deg)', opacity: 1}],
        {duration: 240, easing: 'ease-out'}
      );
    }
    for (const adjacent of [page - 1, page + 1]) {
      if (adjacent >= 1 && adjacent <= item.pages) new Image().src = pageUrl(item, adjacent);
    }
  }

  function changeZoom(percent) {
    zoom = Math.min(250, Math.max(75, percent));
    byId('reset-zoom').textContent = zoom + '%';
    byId('smaller').disabled = zoom === 75;
    byId('bigger').disabled = zoom === 250;
    stage.classList.toggle('fit', zoom <= 100);
    resize();
  }

  const isFull = () => document.fullscreenElement === reader || reader.classList.contains('expanded');
  function syncFullscreen() {
    full.textContent = isFull() ? '전체화면 종료' : '전체화면';
    full.setAttribute('aria-pressed', String(isFull()));
    resize();
  }
  full.addEventListener('click', async () => {
    if (document.fullscreenElement === reader) {
      await document.exitFullscreen();
    } else if (reader.classList.contains('expanded')) {
      reader.classList.remove('expanded');
    } else {
      try {
        await reader.requestFullscreen();
      } catch {
        reader.classList.add('expanded');
      }
    }
    syncFullscreen();
  });
  document.addEventListener('fullscreenchange', syncFullscreen);

  previous.addEventListener('click', () => show(page - 1));
  next.addEventListener('click', () => show(page + 1));
  byId('jump').addEventListener('submit', (event) => {
    event.preventDefault();
    show(target.valueAsNumber);
  });
  toc.addEventListener('change', () => {
    if (toc.value) show(Number(toc.value));
    toc.value = '';
  });
  byId('smaller').addEventListener('click', () => changeZoom(zoom - 25));
  byId('bigger').addEventListener('click', () => changeZoom(zoom + 25));
  byId('reset-zoom').addEventListener('click', () => changeZoom(100));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && reader.classList.contains('expanded')) {
      reader.classList.remove('expanded');
      syncFullscreen();
    }
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        event.target.closest?.('input, select, textarea')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(page + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  stage.addEventListener('touchstart', (event) => {
    touchStart = zoom <= 100 && event.touches.length === 1 ? event.touches[0] : null;
  }, {passive: true});
  stage.addEventListener('touchcancel', () => { touchStart = null; }, {passive: true});
  stage.addEventListener('touchend', (event) => {
    if (!touchStart || event.touches.length) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - touchStart.clientX;
    const dy = end.clientY - touchStart.clientY;
    touchStart = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) show(page + (dx < 0 ? 1 : -1));
  }, {passive: true});

  new ResizeObserver(resize).observe(stage);
  changeZoom(100);
  syncFullscreen();
  show(1, false);
}

if (book) renderReader(book);
else renderShelf();
