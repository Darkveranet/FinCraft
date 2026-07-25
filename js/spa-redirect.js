(function () {
  const redirect = sessionStorage.getItem('_spa_redirect');
  if (redirect) {
    sessionStorage.removeItem('_spa_redirect');
    window.history.replaceState(null, '', redirect);
  }
})();
