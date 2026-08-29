(() => {
  const finePointer = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  const productMenus = Array.from(document.querySelectorAll('.gsp-nav-products'));
  if (!productMenus.length) return;

  function closeMenu(menu) {
    menu.open = false;
    menu.querySelectorAll('.gsp-products-group[open]').forEach(group => { group.open = false; });
  }

  productMenus.forEach(menu => {
    menu.addEventListener('pointerover', event => {
      if (!finePointer.matches) return;
      menu.open = true;
      const group = event.target.closest?.('.gsp-products-group');
      if (group) group.open = true;
    });

    menu.addEventListener('pointerleave', () => {
      if (finePointer.matches && !menu.contains(document.activeElement)) closeMenu(menu);
    });

    menu.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!menu.contains(document.activeElement)) closeMenu(menu);
      });
    });

    menu.addEventListener('click', event => {
      if (event.target.closest?.('a[href]')) closeMenu(menu);
    });
  });

  document.addEventListener('click', event => {
    productMenus.forEach(menu => {
      if (!menu.contains(event.target)) closeMenu(menu);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const menu = document.activeElement?.closest?.('.gsp-nav-products');
    if (!menu) return;
    const group = document.activeElement.closest?.('.gsp-products-group[open]');
    if (group) {
      group.open = false;
      group.querySelector(':scope > summary')?.focus();
      return;
    }
    closeMenu(menu);
    menu.querySelector(':scope > summary')?.focus();
  });

  finePointer.addEventListener?.('change', () => productMenus.forEach(closeMenu));
})();
