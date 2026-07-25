export function enhanceScrollableTabs(tabsEl) {
  if (!tabsEl || tabsEl.dataset.scrollEnhanced) return;
  tabsEl.dataset.scrollEnhanced = '1';

  function update() {
    const { scrollLeft, scrollWidth, clientWidth } = tabsEl;
    tabsEl.classList.toggle('can-scroll-left', scrollLeft > 2);
    tabsEl.classList.toggle('can-scroll-right', scrollLeft + clientWidth < scrollWidth - 2);
  }

  tabsEl.addEventListener('scroll', update, { passive: true });
  tabsEl.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && tabsEl.scrollWidth > tabsEl.clientWidth) {
      e.preventDefault();
      tabsEl.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  new ResizeObserver(update).observe(tabsEl);
  update();
}
