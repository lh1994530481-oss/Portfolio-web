(async function () {
  const api = window.ContentAPI;
  const sanitizer = window.PortfolioSanitize;
  if (!api || !sanitizer) return;

  const textNode = (tagName, value, className) => {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    node.textContent = value || "";
    return node;
  };

  const renderTimeline = (type, items) => {
    const section = document.querySelector('[data-about-section="' + type + '"]');
    const root = document.querySelector("[data-about-" + type + "]");
    const values = Array.isArray(items) ? items.filter(Boolean) : [];
    section.hidden = !values.length;
    root.replaceChildren(...values.map((item) => {
      const article = document.createElement("article");
      article.className = "about-timeline-item";
      const period = textNode("time", item.period, "about-timeline-period");
      const copy = document.createElement("div");
      copy.className = "about-timeline-copy";
      const title = type === "experience" ? item.role : item.degree;
      const organization = type === "experience" ? item.company : item.school;
      copy.append(textNode("h3", title), textNode("strong", organization));
      if (item.description) copy.append(textNode("p", item.description));
      article.append(period, copy);
      return article;
    }));
  };

  const renderSkillCategories = (categories) => {
    const section = document.querySelector('[data-about-section="skills"]');
    const root = document.querySelector("[data-about-skills]");
    const values = (Array.isArray(categories) ? categories : []).filter((category) => (
      category && category.name && Array.isArray(category.items) && category.items.length
    ));
    section.hidden = !values.length;
    root.replaceChildren(...values.map((category) => {
      const card = document.createElement("article");
      card.className = "about-skill-card";
      card.append(textNode("h3", category.name));
      const list = document.createElement("ul");
      list.className = "about-skill-list";
      category.items.forEach((skill) => {
        const percent = Math.max(0, Math.min(100, Number(skill.percent || 0)));
        const item = document.createElement("li");
        const meta = document.createElement("div");
        meta.className = "about-skill-meta";
        meta.append(textNode("span", skill.name), textNode("span", percent + "%"));
        const track = document.createElement("div");
        track.className = "about-skill-track";
        const fill = document.createElement("div");
        fill.className = "about-skill-fill";
        fill.style.width = percent + "%";
        track.append(fill);
        item.append(meta, track);
        list.append(item);
      });
      card.append(list);
      return card;
    }));
  };

  try {
    const settings = await api.getSettings();
    const content = {
      ...(api.defaultAboutDetails || {}),
      ...(settings.aboutDetails || {}),
    };

    document.querySelectorAll("[data-about-text]").forEach((node) => {
      const value = content[node.dataset.aboutText];
      if (typeof value === "string") node.textContent = value;
    });

    const paragraphs = Array.isArray(content.profileParagraphs) && content.profileParagraphs.length
      ? content.profileParagraphs
      : [settings.aboutText].filter(Boolean);
    document.querySelector("[data-about-paragraphs]").replaceChildren(...paragraphs.map((value) => textNode("p", value)));

    const profileSkills = Array.isArray(content.profileSkills) ? content.profileSkills.filter(Boolean) : [];
    const profileSkillsRoot = document.querySelector("[data-about-profile-skills]");
    profileSkillsRoot.hidden = !profileSkills.length;
    profileSkillsRoot.replaceChildren(...profileSkills.map((value) => textNode("li", value)));

    const avatarShell = document.querySelector("[data-about-avatar-shell]");
    const avatar = document.querySelector("[data-about-avatar]");
    const avatarUrl = sanitizer.safeImageUrl(content.avatarUrl || "");
    avatarShell.hidden = !avatarUrl;
    if (avatarUrl) {
      avatar.src = avatarUrl;
      avatar.alt = content.profileTitle || "个人头像";
    } else {
      avatar.removeAttribute("src");
    }

    renderTimeline("experience", content.experience);
    renderTimeline("education", content.education);
    renderSkillCategories(content.skillCategories);

    if (content.pageTitle) document.title = content.pageTitle + " | Lin Tong Xin Portfolio";
    const description = document.querySelector('meta[name="description"]');
    if (description && content.pageSubtitle) description.content = content.pageSubtitle;
    document.body.dataset.contentState = "ready";
  } catch (error) {
    document.body.dataset.contentState = "fallback";
  }
})();
