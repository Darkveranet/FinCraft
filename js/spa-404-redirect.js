(function () {
  const path = window.location.pathname;
  sessionStorage.setItem('_spa_redirect', path);
  window.location.href = window.location.origin + window.location.pathname.split('/').slice(0, 2).join('/') + '/';
})();
