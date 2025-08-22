(function () {
  const tabsEl = document.getElementById('tabs');
  const grid = document.getElementById('grid');             // CHANGED: use grid instead of tbody
  const searchEl = document.getElementById('search');
  const countEl = document.getElementById('count');

  let manifest = null;
  let currentRows = [];

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
    return node;
  }

  function firstImage(images) {
    if (!images) return null;
    const parts = String(images).split('|').map(s => s.trim()).filter(Boolean);
    return parts.length ? parts[0] : null;
  }

  function currency(v) {
    if (v === null || v === undefined || v === '') return '';
    const num = Number(String(v).replace(/[^0-9.\-]/g, ''));
    if (Number.isFinite(num)) return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return String(v);
  }

  // NEW: build a card (top-to-bottom)
  function makeCard(row) {
    const sku = row['PRODUCT_SKU'] ?? '';
    const title = row['PRODUCT_TITLE'] ?? '';
    const brand = row['BRAND'] ?? '';
    const variant = row['variant_facet_value'] ?? '';
    const retailing = row['Retailing'] ?? '';
    const price = row['Price'] ?? '';
    const imgURL = firstImage(row['IMAGES']);

    return el('div', { class: 'card' }, [
      el('div', { class: 'media' }, [
        imgURL ? el('img', { src: imgURL, alt: title || 'image', loading: 'lazy' }) : el('span', { class: 'badge' }, ['No image'])
      ]),
      el('div', { class: 'body' }, [
        el('div', { class: 'title' }, [String(title || sku)]),
        el('div', { class: 'pair' }, [ el('span', { class: 'key' }, ['SKU']),       el('span', { class: 'val' }, [String(sku)]) ]),
        el('div', { class: 'pair' }, [ el('span', { class: 'key' }, ['Brand']),     el('span', { class: 'val' }, [String(brand)]) ]),
        el('div', { class: 'pair' }, [ el('span', { class: 'key' }, ['Variant']),   el('span', { class: 'val' }, [String(variant)]) ]),
        el('div', { class: 'pair' }, [ el('span', { class: 'key' }, ['Retailing']), el('span', { class: 'val' }, [String(retailing)]) ]),
        el('div', { class: 'pair' }, [ el('span', { class: 'key' }, ['Price']),     el('span', { class: 'val' }, [currency(price)]) ]),
      ]),
    ]);
  }

  // REPLACES renderRows(): now renders cards into the grid
  function render(rows) {
    grid.innerHTML = '';
    const q = (searchEl.value || '').trim().toLowerCase();
    let shown = 0;
    for (const row of rows) {
      const textBlob = `${row['PRODUCT_SKU'] ?? ''} ${row['PRODUCT_TITLE'] ?? ''} ${row['BRAND'] ?? ''} ${row['variant_facet_value'] ?? ''}`.toLowerCase();
      if (q && !textBlob.includes(q)) continue;
      grid.appendChild(makeCard(row));
      shown++;
    }
    countEl.textContent = `${shown} item${shown === 1 ? '' : 's'}`;
  }

  // Must call render() after CSV load and on search input
  function activateTab(typeObj, btnEl) {
    Array.from(tabsEl.children).forEach(btn => btn.classList.toggle('active', btn === btnEl));
    Papa.parse(typeObj.file, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: results => {
        currentRows = results.data || [];
        render(currentRows);                     // CHANGED: use render()
      },
      error: err => {
        console.error('CSV load error', err);
        grid.innerHTML = '<div class="badge">Failed to load data.</div>';
        countEl.textContent = '0 items';
      }
    });
  }

  function buildTabs() {
    tabsEl.innerHTML = '';
    (manifest.types || []).forEach((t, i) => {
      const btn = el('button', { class: 'tab' + (i === 0 ? ' active' : ''), dataset: { type: t.type } }, [
        `${t.type} `, el('span', { class: 'badge' }, [String(t.count)])
      ]);
      btn.addEventListener('click', () => activateTab(t, btn));
      tabsEl.appendChild(btn);
    });
    if (manifest.types && manifest.types.length) {
      const firstBtn = tabsEl.children[0];
      activateTab(manifest.types[0], firstBtn); // triggers initial render()
    }
  }

  fetch('data/types.json')
    .then(r => r.json())
    .then(m => { manifest = m; buildTabs(); })
    .catch(err => {
      console.error('Failed to load manifest', err);
      tabsEl.innerHTML = '<span class="badge">No data</span>';
    });

  searchEl.addEventListener('input', () => render(currentRows));  // CHANGED: call render()
})();
