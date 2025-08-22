
(function () {
  const tabsEl = document.getElementById('tabs');
  const tbody = document.getElementById('tbody');
  const searchEl = document.getElementById('search');
  const countEl = document.getElementById('count');
  const activeTypeBadge = document.getElementById('activeType');

  let manifest = null;
  let currentType = null;
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
    if (!parts.length) return null;
    return parts[0];
  }

  function currency(v) {
    if (v === null || v === undefined || v === '') return '';
    const num = Number(String(v).replace(/[^0-9.\-]/g, ''));
    if (Number.isFinite(num)) return num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    return String(v);
  }

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

  function activateTab(typeObj) {
    currentType = typeObj;
    activeTypeBadge.textContent = typeObj.type;
    Array.from(tabsEl.children).forEach(btn => btn.classList.toggle('active', btn.dataset.type === typeObj.type));

    Papa.parse(typeObj.file, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: results => {
        currentRows = results.data || [];
        renderRows(currentRows);
      },
      error: err => {
        console.error('CSV load error', err);
        tbody.innerHTML = '<tr><td colspan="7">Failed to load data.</td></tr>';
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
      btn.addEventListener('click', () => activateTab(t));
      tabsEl.appendChild(btn);
    });
    if (manifest.types && manifest.types.length) activateTab(manifest.types[0]);
  }

  fetch('data/types.json')
    .then(r => r.json())
    .then(m => { manifest = m; buildTabs(); })
    .catch(err => {
      console.error('Failed to load manifest', err);
      tabsEl.innerHTML = '<span class="badge">No data</span>';
    });

  searchEl.addEventListener('input', () => renderRows(currentRows));
})();
