(function () {
  const normalizeProjectClassification = (project) => {
    if (!project || project.slug !== "homi-smart-home-prototype") return project;
    const legacyCategory = project.category === "Exercises and Demos";
    const legacyTags = !Array.isArray(project.tags)
      || project.tags.length === 0
      || (project.tags.length === 1 && project.tags[0] === "Exercises and Demos");
    return {
      ...project,
      itemType: "demo",
      category: legacyCategory || !project.category ? "原型" : project.category,
      tags: legacyTags ? ["智能家居", "交互原型", "场景自动化", "安防告警", "能源管理"] : project.tags,
    };
  };

  const sortContent = (items) => items.slice().sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  const ensureRequiredNavigation = (items, defaults) => {
    const navigation = items.slice();
    const demoDefault = defaults.find((item) => item.href === "./demos/index.html");
    const hasDemos = navigation.some((item) => item.id === demoDefault.id || item.href === demoDefault.href || item.label === demoDefault.label);
    if (!hasDemos) {
      const portfolioIndex = navigation.findIndex((item) => item.href === "./portfolio/index.html" || item.label === "作品集");
      navigation.splice(portfolioIndex >= 0 ? portfolioIndex + 1 : navigation.length, 0, { ...demoDefault });
    }
    const aboutDefault = defaults.find((item) => item.href === "./about/index.html");
    const hasAbout = navigation.some((item) => item.id === aboutDefault.id || item.href === aboutDefault.href || item.label === aboutDefault.label);
    if (!hasAbout) {
      const consultationIndex = navigation.findIndex((item) => item.href === "./consultation/index.html" || item.label === "咨询");
      navigation.splice(consultationIndex >= 0 ? consultationIndex : navigation.length, 0, { ...aboutDefault });
    }
    const consultationDefault = defaults.find((item) => item.href === "./consultation/index.html");
    const hasConsultation = navigation.some((item) => item.id === consultationDefault.id || item.href === consultationDefault.href || item.label === consultationDefault.label);
    if (!hasConsultation) navigation.push({ ...consultationDefault });
    return navigation;
  };

  window.PortfolioContentModels = { normalizeProjectClassification, sortContent, ensureRequiredNavigation };
})();
