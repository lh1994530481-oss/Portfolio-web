(function () {
  const storageKey = "lin-tong-xin-cms:authenticated";
  const hasMarker = () => window.sessionStorage.getItem(storageKey) === "true";
  const markAuthenticated = () => window.sessionStorage.setItem(storageKey, "true");
  const clear = () => window.sessionStorage.removeItem(storageKey);
  window.PortfolioAdminAuth = { storageKey, hasMarker, markAuthenticated, clear };
})();
