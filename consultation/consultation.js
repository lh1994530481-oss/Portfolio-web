(async function () {
  const api = window.ContentAPI;
  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  };
  refreshIcons();
  if (!api) return;

  try {
    const settings = await api.getSettings();
    const defaults = api.defaultConsultationContent || {};
    const content = {
      ...defaults,
      ...(settings.consultationContent || {}),
    };

    document.querySelectorAll("[data-consultation-text]").forEach((node) => {
      const value = content[node.dataset.consultationText];
      if (typeof value === "string") node.textContent = value;
    });

    document.querySelectorAll("[data-consultation-placeholder]").forEach((node) => {
      const value = content[node.dataset.consultationPlaceholder];
      if (typeof value === "string") node.placeholder = value;
    });

    const projectTypeFieldset = document.querySelector(".consultation-project-types");
    const projectTypes = Array.isArray(content.projectTypes) && content.projectTypes.length
      ? content.projectTypes
      : defaults.projectTypes || [];
    projectTypeFieldset.querySelectorAll("label").forEach((label) => label.remove());
    projectTypes.forEach((value) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      const text = document.createElement("span");
      input.name = "projectTypes";
      input.type = "checkbox";
      input.value = value;
      text.textContent = value;
      label.append(input, text);
      projectTypeFieldset.append(label);
    });

    const budgetSelect = document.querySelector('select[name="budget"]');
    const budgetOptions = Array.isArray(content.budgetOptions) && content.budgetOptions.length
      ? content.budgetOptions
      : defaults.budgetOptions || [];
    budgetSelect.replaceChildren(...budgetOptions.map((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      return option;
    }));

    const processList = document.querySelector(".consultation-process-list");
    const processSteps = Array.isArray(content.processSteps) && content.processSteps.length
      ? content.processSteps
      : defaults.processSteps || [];
    processList.replaceChildren(...processSteps.map((value, index) => {
      const item = document.createElement("li");
      const number = document.createElement("span");
      const label = document.createElement("strong");
      number.textContent = String(index + 1).padStart(2, "0");
      label.textContent = value;
      item.append(number, label);
      return item;
    }));

    if (content.heroTitle) document.title = content.heroTitle + " | Lin Tong Xin Portfolio";
    const description = document.querySelector('meta[name="description"]');
    if (description && content.heroDescription) description.content = content.heroDescription;

    document.querySelectorAll("[data-content]").forEach((node) => {
      const value = settings[node.dataset.content];
      if (value) node.textContent = value;
    });

    document.querySelectorAll("[data-content-mail]").forEach((node) => {
      const value = settings[node.dataset.contentMail];
      if (value) node.href = "mailto:" + value;
    });

    refreshIcons();
  } catch (error) {
    document.body.dataset.contentState = "fallback";
  }
})();
