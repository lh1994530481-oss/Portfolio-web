(function () {
  const api = window.ContentAPI;
  if (!api) return;

  const sessionKey = "lin-portfolio:visitor-session";
  const getSessionId = () => {
    let value = window.sessionStorage.getItem(sessionKey);
    if (!value) {
      value = window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : "session-" + Date.now() + "-" + Math.random().toString(16).slice(2);
      window.sessionStorage.setItem(sessionKey, value);
    }
    return value;
  };

  const deviceType = () => {
    if (window.innerWidth < 768) return "mobile";
    if (window.innerWidth < 1100) return "tablet";
    return "desktop";
  };

  const track = (eventName, details) => {
    let referrerHost = "";
    try {
      referrerHost = document.referrer ? new URL(document.referrer).hostname : "";
    } catch (error) {
      referrerHost = "";
    }
    api.trackEvent({
      eventName,
      path: (window.location.pathname + window.location.search).slice(0, 500) || "/",
      sessionId: getSessionId(),
      deviceType: deviceType(),
      referrerHost: referrerHost.slice(0, 255),
      ...(details || {}),
    }).catch(() => {});
  };

  track("page_view");

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (!/(portfolio|articles|prototypes|project-detail|article-detail)/i.test(href)) return;
    track("content_click", {
      contentType: href.includes("articles") || href.includes("article-detail") ? "article" : href.includes("prototype") ? "prototype" : "project",
      contentId: link.dataset.slug || href.slice(0, 160),
    });
  });

  const inquiryForm = document.getElementById("inquiry-form");
  if (inquiryForm) {
    const status = document.getElementById("inquiry-form-status");
    inquiryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const action = event.submitter && event.submitter.dataset.inquiryAction === "quote" ? "quote" : "inquiry";
      const formData = new FormData(inquiryForm);
      const values = Object.fromEntries(formData.entries());
      if (values.company) return;
      const button = event.submitter || inquiryForm.querySelector('button[type="submit"]');
      button.disabled = true;
      status.textContent = "正在提交...";
      status.classList.remove("is-error");
      try {
        const request = {
          name: String(values.name || "").trim(),
          contact: String(values.email || values.contact || "").trim(),
          email: String(values.email || "").trim(),
          projectTypes: formData.getAll("projectTypes").map((item) => String(item)),
          projectType: formData.getAll("projectTypes")[0] || "其他",
          budget: String(values.budget || "待沟通"),
          message: String(values.message || "").trim(),
          details: String(values.message || "").trim(),
        };
        if (action === "quote") await api.submitQuoteRequest(request);
        else await api.submitInquiry(request);
        inquiryForm.reset();
        status.textContent = action === "quote" ? "报价需求已提交，我会尽快完成评估。" : "已收到，我会尽快联系你。";
        track("contact_submit", { contentType: action, contentId: formData.getAll("projectTypes").join(",") || "其他" });
      } catch (error) {
        status.textContent = "提交失败，请稍后重试或使用上方联系方式。";
        status.classList.add("is-error");
      } finally {
        button.disabled = false;
      }
    });
  }

  let protectedSlug = "";
  const accessDialog = document.createElement("dialog");
  accessDialog.className = "project-access-dialog";
  accessDialog.innerHTML = [
    '<form method="dialog" data-project-access-form>',
    '  <div class="project-access-heading"><h2 data-project-access-title>受保护的项目</h2><p>此作品受密码保护</p></div>',
    '  <label><span>密码</span><input name="password" type="password" autocomplete="current-password" required /></label>',
    '  <small data-project-access-status role="status"></small>',
    '  <button type="submit">提交</button>',
    '</form>',
  ].join("");
  document.body.appendChild(accessDialog);
  const accessForm = accessDialog.querySelector("[data-project-access-form]");
  const accessStatus = accessDialog.querySelector("[data-project-access-status]");
  const accessTitle = accessDialog.querySelector("[data-project-access-title]");
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-protected-project]");
    if (!link) return;
    event.preventDefault();
    protectedSlug = link.dataset.protectedProject;
    const nearbyTitle = link.closest("article")?.querySelector("h2, h3")?.textContent.trim();
    const labelledTitle = String(link.getAttribute("aria-label") || "").replace(/^(查看|打开)/, "").replace(/(项目|演示)$/, "").trim();
    accessTitle.textContent = link.dataset.protectedProjectTitle || nearbyTitle || labelledTitle || "受保护的项目";
    accessStatus.textContent = "";
    accessStatus.classList.remove("is-error");
    accessForm.reset();
    accessDialog.showModal();
    window.setTimeout(() => accessForm.elements.namedItem("password").focus(), 30);
  });
  accessDialog.addEventListener("click", (event) => { if (event.target === accessDialog) accessDialog.close(); });
  accessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = accessForm.querySelector('button[type="submit"]');
    button.disabled = true;
    accessStatus.textContent = "正在验证...";
    try {
      const target = await api.verifyProjectAccess(protectedSlug, accessForm.elements.namedItem("password").value);
      if (!target) throw new Error("访问密码不正确");
      accessStatus.textContent = "验证成功，正在打开...";
      track("content_click", { contentType: "protected_demo", contentId: protectedSlug });
      window.location.href = target;
    } catch (error) {
      accessStatus.textContent = error.message || "验证失败，请重试";
      accessStatus.classList.add("is-error");
    } finally {
      button.disabled = false;
    }
  });

  const trigger = document.getElementById("ai-assistant-trigger");
  const dialog = document.getElementById("ai-assistant-dialog");
  if (!trigger || !dialog) return;

  const nameNode = dialog.querySelector("[data-ai-name]");
  const introNode = dialog.querySelector("[data-ai-introduction]");
  const messages = dialog.querySelector("[data-ai-messages]");
  const suggestions = dialog.querySelector("[data-ai-suggestions]");
  const form = dialog.querySelector("[data-ai-form]");
  const input = form.elements.namedItem("question");
  let profile = api.defaultAiProfile;

  const appendMessage = (text, role) => {
    const node = document.createElement("p");
    node.className = "ai-message is-" + role;
    node.textContent = text;
    messages.appendChild(node);
    messages.scrollTop = messages.scrollHeight;
  };

  const answerQuestion = (question) => {
    appendMessage(question, "user");
    const normalized = question.toLowerCase();
    const match = (profile.knowledgeBase || []).find((item) =>
      Array.isArray(item.keywords) && item.keywords.some((keyword) => normalized.includes(String(keyword).toLowerCase()))
    );
    window.setTimeout(() => appendMessage(match && match.answer ? match.answer : profile.fallbackMessage, "assistant"), 180);
  };

  api.getAiProfile(false).then((value) => {
    profile = value;
    if (!profile.enabled) return;
    trigger.hidden = false;
    nameNode.textContent = profile.displayName;
    introNode.textContent = profile.introduction || "可以问我关于项目、设计经验和合作方式的问题。";
    messages.replaceChildren();
    appendMessage((profile.openingMessages || [])[0] || profile.greeting, "assistant");
    suggestions.replaceChildren(...(profile.suggestedQuestions || []).map((question) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = question;
      button.addEventListener("click", () => answerQuestion(question));
      return button;
    }));
  }).catch(() => {});

  trigger.addEventListener("click", () => {
    if (!dialog.open) dialog.showModal();
    track("ai_open", { contentType: "assistant", contentId: "main" });
  });
  dialog.querySelector("[data-ai-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    input.value = "";
    answerQuestion(question);
  });
})();
