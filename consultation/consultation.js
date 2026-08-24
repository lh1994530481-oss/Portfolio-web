(async function () {
  const api = window.ContentAPI;
  if (!api) return;

  try {
    const settings = await api.getSettings();

    document.querySelectorAll("[data-content]").forEach((node) => {
      const value = settings[node.dataset.content];
      if (value) node.textContent = value;
    });

    document.querySelectorAll("[data-content-mail]").forEach((node) => {
      const value = settings[node.dataset.contentMail];
      if (value) node.href = "mailto:" + value;
    });
  } catch (error) {
    document.body.dataset.contentState = "fallback";
  }
})();
