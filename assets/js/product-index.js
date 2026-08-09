(() => {
  'use strict';

  const searchInput = document.getElementById('product-index-search');
  const clearButton = document.getElementById('product-search-clear');
  const resultStatus = document.getElementById('product-results-count');
  const emptyState = document.getElementById('product-index-empty');
  const cards = [...document.querySelectorAll('[data-product-card]')];
  const groups = [...document.querySelectorAll('[data-product-group]')];

  if (!searchInput || !clearButton || !resultStatus || !emptyState || !cards.length) return;

  function normalize(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9/]+/g, ' ')
      .trim();
  }

  const searchableCards = cards.map(card => {
    const text = normalize(card.dataset.search || card.textContent);
    return { card, text, compact: text.replace(/\s+/g, '') };
  });

  function matchesQuery(item, query) {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    return terms.every(term => item.text.includes(term) || item.compact.includes(term.replace(/\s+/g, '')));
  }

  function updateResults() {
    const query = searchInput.value;
    let visibleCount = 0;

    for (const item of searchableCards) {
      const visible = matchesQuery(item, query);
      item.card.hidden = !visible;
      if (visible) visibleCount += 1;
    }

    for (const group of groups) {
      const visibleInGroup = group.querySelector('[data-product-card]:not([hidden])') !== null;
      group.hidden = !visibleInGroup;
      const directoryLink = document.querySelector(`.index-directory-links a[href="#${group.id}"]`);
      if (directoryLink) directoryLink.hidden = !visibleInGroup;
    }

    const hasQuery = normalize(query).length > 0;
    clearButton.hidden = !hasQuery;
    emptyState.hidden = visibleCount !== 0;
    resultStatus.textContent = hasQuery
      ? `${visibleCount} ${visibleCount === 1 ? 'product' : 'products'} match “${query.trim()}”.`
      : `Showing all ${cards.length} products.`;
  }

  searchInput.addEventListener('input', updateResults);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Escape' && searchInput.value) {
      searchInput.value = '';
      updateResults();
    }
  });
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    updateResults();
    searchInput.focus();
  });
})();
