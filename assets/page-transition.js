(function () {
  const transitionKey = "portfolio:pageTransition";
  const returnKey = "portfolio:returnTarget";
  const restoreKey = "portfolio:restoreScroll";
  const duration = 620;
  const maxStateAge = 8000;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let overlay = null;
  let isTransitioning = false;

  const readState = (key) => {
    try {
      return JSON.parse(window.sessionStorage.getItem(key) || "null");
    } catch (error) {
      return null;
    }
  };

  const writeState = (key, value) => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Session storage can be unavailable in strict privacy contexts.
    }
  };

  const removeState = (key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      // Nothing to clean up.
    }
  };

  const getOverlay = () => {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "page-transition-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
    return overlay;
  };

  const comparableUrl = (href) => {
    const url = new URL(href, window.location.href);
    const normalizedPath = url.pathname.replace(/\/index\.html$/i, "/");
    return url.protocol + "//" + url.host + normalizedPath + url.search;
  };

  const isSamePage = (left, right) => comparableUrl(left) === comparableUrl(right);

  const isFreshState = (state) => state && Date.now() - Number(state.at || 0) < maxStateAge;

  const getPoint = (event, anchor) => {
    if (event && event.detail !== 0 && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    }

    const rect = anchor.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const getRadius = (point) => {
    const maxX = Math.max(point.x, window.innerWidth - point.x);
    const maxY = Math.max(point.y, window.innerHeight - point.y);
    return Math.ceil(Math.hypot(maxX, maxY) + 80);
  };

  const setCircle = (node, point, radius) => {
    node.style.setProperty("--page-transition-x", point.x.toFixed(1) + "px");
    node.style.setProperty("--page-transition-y", point.y.toFixed(1) + "px");
    node.style.setProperty("--page-transition-radius", radius + "px");
  };

  const isProjectDetailUrl = (url) => /\/portfolio\/project-detail\.html$/i.test(url.pathname);

  const getReturnHref = () => {
    const current = new URL(window.location.href);
    if (document.body.classList.contains("home-body")) {
      current.hash = "portfolio";
    }
    return current.href;
  };

  const rememberReturnTarget = (targetUrl) => {
    if (!isProjectDetailUrl(targetUrl) || isProjectDetailUrl(new URL(window.location.href))) {
      return;
    }

    writeState(returnKey, {
      href: getReturnHref(),
      scrollY: window.scrollY || 0,
      at: Date.now(),
    });
  };

  const rememberRestoreTarget = (anchor) => {
    if (!anchor.classList.contains("project-back") && anchor.dataset.transitionRestore !== "true") {
      return;
    }

    const state = readState(returnKey);
    if (!state || !state.href) {
      return;
    }

    writeState(restoreKey, {
      href: state.href,
      scrollY: Number(state.scrollY || 0),
      at: Date.now(),
    });
  };

  const shouldHandleLink = (anchor, url) => {
    if (!anchor || anchor.hasAttribute("download")) return false;
    if (anchor.target && anchor.target !== "_self") return false;
    if (!["http:", "https:", "file:"].includes(url.protocol)) return false;
    if (url.protocol !== "file:" && url.origin !== window.location.origin) return false;

    const currentWithoutHash = new URL(window.location.href);
    currentWithoutHash.hash = "";
    const targetWithoutHash = new URL(url.href);
    targetWithoutHash.hash = "";

    if (isSamePage(currentWithoutHash.href, targetWithoutHash.href) && url.hash) {
      return false;
    }

    return /\.html$/i.test(url.pathname) || /\/$/i.test(url.pathname);
  };

  const goTo = (url, point) => {
    if (reduceMotion) {
      window.location.href = url.href;
      return;
    }

    const node = getOverlay();
    const radius = getRadius(point);
    isTransitioning = true;
    document.documentElement.classList.add("page-transition-lock");
    node.style.transitionDuration = duration + "ms";
    setCircle(node, point, 0);
    node.getBoundingClientRect();

    writeState(transitionKey, {
      href: url.href,
      x: point.x,
      y: point.y,
      radius,
      at: Date.now(),
    });

    window.requestAnimationFrame(() => {
      setCircle(node, point, radius);
    });

    window.setTimeout(() => {
      window.location.href = url.href;
    }, duration);
  };

  const handleClick = (event) => {
    if (isTransitioning || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor) return;

    let url;
    try {
      url = new URL(anchor.getAttribute("href"), window.location.href);
    } catch (error) {
      return;
    }

    if (!shouldHandleLink(anchor, url)) return;

    event.preventDefault();
    rememberReturnTarget(url);
    rememberRestoreTarget(anchor);
    goTo(url, getPoint(event, anchor));
  };

  const playEnterTransition = () => {
    const state = readState(transitionKey);
    removeState(transitionKey);

    if (reduceMotion || !isFreshState(state) || !state.href || !isSamePage(state.href, window.location.href)) {
      return;
    }

    const node = getOverlay();
    const point = {
      x: Number(state.x || window.innerWidth / 2),
      y: Number(state.y || window.innerHeight / 2),
    };
    const radius = Number(state.radius || getRadius(point));

    node.style.transitionDuration = "0ms";
    setCircle(node, point, radius);
    node.getBoundingClientRect();
    node.style.transitionDuration = duration + "ms";

    window.requestAnimationFrame(() => {
      setCircle(node, point, 0);
    });

    window.setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      overlay = null;
      document.documentElement.classList.remove("page-transition-lock");
    }, duration + 80);
  };

  const restoreScroll = () => {
    const state = readState(restoreKey);
    if (!isFreshState(state) || !state.href || !isSamePage(state.href, window.location.href)) {
      return;
    }

    removeState(restoreKey);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: Number(state.scrollY || 0),
          left: 0,
          behavior: "auto",
        });
      });
    });
  };

  window.addEventListener("pageshow", () => {
    isTransitioning = false;
    document.documentElement.classList.remove("page-transition-lock");
  });

  window.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", handleClick);
    restoreScroll();
    playEnterTransition();
  });
})();
