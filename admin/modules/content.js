(function () {
  const normalizeTags = (value, fallback) => String(value || fallback || "")
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const validateProjectAccess = (values, existingProject) => {
    const protectedTarget = String(values.protectedTargetUrl || values.prototypeHref || "").trim();
    const accessPassword = String(values.accessPassword || "");
    const accessPasswordBytes = accessPassword ? new TextEncoder().encode(accessPassword).length : 0;
    if (values.passwordEnabled && !protectedTarget) throw new Error("私密项目必须填写受保护跳转地址");
    if (values.passwordEnabled && !existingProject?.passwordEnabled && !accessPassword) throw new Error("首次开启私密项目时必须填写访问密码");
    if (accessPassword && accessPasswordBytes < 6) throw new Error("访问密码至少需要 6 个字节");
    if (accessPasswordBytes > 72) throw new Error("访问密码不能超过 72 个字节");
    return { protectedTarget, accessPasswordBytes };
  };

  const validateArticle = (values) => {
    if (!String(values.title || "").trim()) throw new Error("文章标题不能为空");
    if (!/^[a-z0-9-]+$/.test(String(values.slug || ""))) throw new Error("文章 Slug 仅支持小写字母、数字和连字符");
    return values;
  };

  window.PortfolioAdminContent = { normalizeTags, validateProjectAccess, validateArticle };
})();
