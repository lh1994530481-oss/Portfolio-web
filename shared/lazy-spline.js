(function () {
  const shell = document.querySelector("[data-spline-shell]");
  const host = document.querySelector("[data-spline-host]");
  if (!shell || !host) return;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean(connection && connection.saveData);
  const slowConnection = Boolean(connection && /^(?:slow-2g|2g)$/.test(connection.effectiveType || ""));
  const lowMemory = Number(navigator.deviceMemory || 4) <= 2;
  const lowCpu = Number(navigator.hardwareConcurrency || 4) <= 2;
  const shouldUseFallback = reducedMotion || saveData || slowConnection || lowMemory || lowCpu;

  const fallback = (reason) => {
    shell.classList.add("is-static-scene");
    shell.dataset.sceneMode = reason;
  };

  if (shouldUseFallback) {
    fallback(reducedMotion ? "reduced-motion" : saveData ? "save-data" : slowConnection ? "slow-network" : "low-end-device");
    return;
  }

  const loadViewer = () => {
    if (host.dataset.loading === "true") return;
    host.dataset.loading = "true";
    const runtime = document.createElement("script");
    runtime.type = "module";
    runtime.src = "https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js";
    runtime.addEventListener("error", () => fallback("runtime-error"), { once: true });
    runtime.addEventListener("load", async () => {
      try {
        await customElements.whenDefined("spline-viewer");
        const viewer = document.createElement("spline-viewer");
        viewer.id = "scene-viewer";
        viewer.setAttribute("url", host.dataset.sceneUrl || "./assets/scene.splinecode");
        viewer.setAttribute("loading-anim-type", "spinner-small-light");
        viewer.addEventListener("load", () => shell.classList.add("is-scene-ready"), { once: true });
        host.replaceChildren(viewer);
      } catch (error) {
        fallback("viewer-error");
      }
    }, { once: true });
    document.head.appendChild(runtime);
  };

  const schedule = () => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(loadViewer, { timeout: 1800 });
    else window.setTimeout(loadViewer, 900);
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
})();
