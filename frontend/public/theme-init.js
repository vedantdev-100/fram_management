// Apply before the app and styles load, avoiding a light flash on dark pages.
(function () {
  var theme;
  try { theme = localStorage.getItem("fieldwork-theme"); } catch (_) {}
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
