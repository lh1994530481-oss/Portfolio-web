const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0, edge1, value) {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  let lastY = window.scrollY;

  const onScroll = () => {
    const currentY = Math.max(window.scrollY, 0);
    const delta = currentY - lastY;

    if (currentY < 80) {
      header.classList.remove("is-hidden");
      lastY = currentY;
      return;
    }

    if (Math.abs(delta) >= 8) {
      header.classList.toggle("is-hidden", delta > 0);
      lastY = currentY;
    }
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

function initReveal() {
  const nodes = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  nodes.forEach((node) => observer.observe(node));
}

function initMagnetic() {
  if (reduceMotion || !pointerFine) {
    return;
  }

  const updateDock = (node, event, bound = 1.6, force = 14, scaleForce = 0.05) => {
    const rect = node.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const limit = Math.max(rect.width, rect.height) * bound;
    const proximity = Math.max(0, 1 - distance / limit);
    const moveX = (deltaX / rect.width) * force * proximity;
    const moveY = (deltaY / rect.height) * force * proximity;
    const scale = 1 + scaleForce * proximity;

    node.style.setProperty("--dock-x", moveX.toFixed(2) + "px");
    node.style.setProperty("--dock-y", moveY.toFixed(2) + "px");
    node.style.setProperty("--dock-scale", scale.toFixed(3));
  };

  const resetDock = (node) => {
    node.style.setProperty("--dock-x", "0px");
    node.style.setProperty("--dock-y", "0px");
    node.style.setProperty("--dock-scale", "1");
  };

  document.querySelectorAll(".magnetic").forEach((node) => {
    node.addEventListener("pointermove", (event) => updateDock(node, event));
    node.addEventListener("pointerleave", () => resetDock(node));
  });
}

function initProjectWall() {
  const grid = document.querySelector(".projects-grid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".project-card"));
  const resetGrid = () => {
    grid.classList.remove("is-hovering", "is-hovering-col-1", "is-hovering-col-2", "is-hovering-col-3");
  };

  if (!pointerFine || reduceMotion) {
    grid.addEventListener("pointerleave", resetGrid);
    return;
  }

  const activateColumn = (column) => {
    resetGrid();
    grid.classList.add("is-hovering", "is-hovering-col-" + column);
  };

  cards.forEach((card) => {
    const column = card.dataset.column;

    card.addEventListener("pointerenter", () => {
      if (!column) return;
      activateColumn(column);
    });

    card.addEventListener("focusin", () => {
      if (!column) return;
      activateColumn(column);
    });
  });

  grid.addEventListener("pointerleave", resetGrid);
  grid.addEventListener("focusout", (event) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && grid.contains(nextTarget)) return;
    resetGrid();
  });
}

function initScrollScene() {
  const root = document.documentElement;
  const heroCopy = document.querySelector(".hero-copy");
  const aboutCopy = document.querySelector(".about-copy");

  if (!heroCopy || !aboutCopy) return;

  const update = () => {
    const viewport = window.innerHeight || 1;
    const maxScroll = Math.max(document.documentElement.scrollHeight - viewport, 1);
    const scrollY = window.scrollY || 0;
    const progress = scrollY / viewport;

    const drift = smoothstep(0, 1.05, progress);
    const settle = smoothstep(1.08, 1.9, progress);
    const shiftX = lerp(0, window.innerWidth * 0.014, drift) - lerp(0, window.innerWidth * 0.022, settle);
    const shiftY = lerp(0, -window.innerHeight * 0.08, drift);
    const scale = lerp(1.02, 1.14, smoothstep(0, 1.5, progress));

    const heroOpacity = 1 - smoothstep(0.16, 0.56, progress);
    const aboutFadeIn = smoothstep(0.92, 1.12, progress);
    const aboutFadeOut = smoothstep(1.24, 1.62, progress);
    const aboutOpacity = Math.max(0, Math.min(1, aboutFadeIn * (1 - aboutFadeOut)));
    const radialOpacity = smoothstep(1.18, 1.78, progress) * 0.74;

    root.style.setProperty("--scene-x", shiftX.toFixed(2) + "px");
    root.style.setProperty("--scene-y", shiftY.toFixed(2) + "px");
    root.style.setProperty("--scene-scale", scale.toFixed(3));
    root.style.setProperty("--hero-opacity", heroOpacity.toFixed(3));
    root.style.setProperty("--about-opacity", aboutOpacity.toFixed(3));
    root.style.setProperty("--radial-mask-opacity", radialOpacity.toFixed(3));
    root.style.setProperty("--scroll-progress", String(Math.min(scrollY / maxScroll, 1)));
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function initFallbackSceneCanvas(canvas, shell) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let mouseX = 0;
  let mouseY = 0;

  const shards = [
    { x: 0.12, y: 0.16, w: 0.22, h: 0.14, rotation: 0.48, spin: 0.06, drift: 18, tintA: "#f7dbe8", tintB: "#090709", depth: 0.92, phase: 0.2 },
    { x: -0.27, y: -0.04, w: 0.2, h: 0.1, rotation: -0.62, spin: -0.05, drift: 14, tintA: "#efbfd3", tintB: "#0a090a", depth: 0.78, phase: 0.8 },
    { x: 0.34, y: -0.14, w: 0.14, h: 0.1, rotation: -1.04, spin: 0.07, drift: 12, tintA: "#f2c6de", tintB: "#090709", depth: 0.82, phase: 1.4 },
    { x: -0.08, y: 0.23, w: 0.12, h: 0.08, rotation: 0.88, spin: -0.04, drift: 10, tintA: "#d08cb5", tintB: "#050506", depth: 0.68, phase: 2.1 },
    { x: 0.21, y: 0.04, w: 0.16, h: 0.1, rotation: -0.22, spin: 0.05, drift: 11, tintA: "#f6dce8", tintB: "#060507", depth: 0.74, phase: 2.8 },
    { x: -0.21, y: 0.19, w: 0.12, h: 0.07, rotation: -0.9, spin: 0.03, drift: 8, tintA: "#cea2b8", tintB: "#060507", depth: 0.62, phase: 3.2 },
    { x: 0.37, y: 0.22, w: 0.11, h: 0.07, rotation: 0.74, spin: -0.03, drift: 9, tintA: "#f4d4e6", tintB: "#060608", depth: 0.6, phase: 3.8 },
    { x: -0.34, y: 0.18, w: 0.1, h: 0.06, rotation: -0.14, spin: 0.04, drift: 7, tintA: "#b36490", tintB: "#040405", depth: 0.54, phase: 4.1 },
  ];

  const resize = () => {
    const rect = shell.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawShard = (shard, time) => {
    const centerX = width * (0.5 + shard.x) + mouseX * shard.drift;
    const centerY = height * (0.48 + shard.y) + mouseY * shard.drift * 0.8;
    const size = Math.min(width, height);
    const shardWidth = size * shard.w;
    const shardHeight = size * shard.h;
    const rotation = shard.rotation + time * shard.spin + mouseX * 0.12;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.moveTo(-shardWidth * 0.48, -shardHeight * 0.44);
    ctx.lineTo(shardWidth * 0.42, -shardHeight * 0.58);
    ctx.lineTo(shardWidth * 0.56, shardHeight * 0.18);
    ctx.lineTo(-shardWidth * 0.26, shardHeight * 0.56);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(-shardWidth * 0.5, -shardHeight * 0.5, shardWidth * 0.55, shardHeight * 0.55);
    gradient.addColorStop(0, shard.tintA);
    gradient.addColorStop(0.34, "rgba(255, 236, 246, 0.82)");
    gradient.addColorStop(0.6, "rgba(72, 22, 46, 0.48)");
    gradient.addColorStop(1, shard.tintB);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = shard.depth;
    ctx.fill();

    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(255, 196, 228, 0.22)";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-shardWidth * 0.18, -shardHeight * 0.5);
    ctx.lineTo(shardWidth * 0.46, shardHeight * 0.16);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.stroke();
    ctx.restore();
  };

  const renderFrame = (timeMs) => {
    const time = timeMs * 0.001;
    ctx.clearRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.5, height * 0.48, width * 0.04, width * 0.5, height * 0.48, width * 0.28);
    glow.addColorStop(0, "rgba(74, 24, 48, 0.18)");
    glow.addColorStop(0.45, "rgba(22, 8, 16, 0.06)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    shards
      .slice()
      .sort((left, right) => left.depth - right.depth)
      .forEach((shard) => drawShard(shard, time + shard.phase));
  };

  const tick = (timeMs) => {
    renderFrame(timeMs);
    if (!reduceMotion) {
      rafId = window.requestAnimationFrame(tick);
    }
  };

  resize();

  if (reduceMotion) {
    renderFrame(0);
  } else {
    rafId = window.requestAnimationFrame(tick);
    window.addEventListener("pointermove", (event) => {
      mouseX = event.clientX / window.innerWidth - 0.5;
      mouseY = event.clientY / window.innerHeight - 0.5;
    });
  }

  window.addEventListener("resize", resize);
}

function initSceneCanvas() {
  const canvas = document.getElementById("scene-canvas");
  const shell = document.querySelector(".scene-shell");

  if (!canvas || !shell) return;
  if (typeof window.THREE === "undefined") {
    initFallbackSceneCanvas(canvas, shell);
    return;
  }

  const { THREE } = window;
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    initFallbackSceneCanvas(canvas, shell);
    return;
  }

  renderer.setClearColor(0x000000, 0);
  if ("outputEncoding" in renderer && "sRGBEncoding" in THREE) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.034);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const panelGroup = new THREE.Group();
  rootGroup.add(panelGroup);

  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipMapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
  scene.add(cubeCamera);

  const room = new THREE.Mesh(
    new THREE.OctahedronBufferGeometry(18, 2),
    new THREE.MeshBasicMaterial({
      color: 0x050507,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.98,
    }),
  );
  scene.add(room);

  const ambience = new THREE.Mesh(
    new THREE.IcosahedronBufferGeometry(9.6, 1),
    new THREE.MeshBasicMaterial({
      color: 0x12060f,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.18,
    }),
  );
  scene.add(ambience);

  const glowCards = [
    { color: 0x9a2959, position: [4.8, 1.3, -2.8], rotation: [0.14, -0.48, 0.22], size: [6.2, 2.1] },
    { color: 0x5e4ef5, position: [-5.1, -0.9, -3.2], rotation: [-0.22, 0.44, -0.2], size: [5.8, 2.4] },
    { color: 0xf3d7ee, position: [0.6, 4.5, -4.1], rotation: [0.42, 0.08, -0.24], size: [4.6, 1.5] },
  ];

  const glowPlanes = [];

  glowCards.forEach((card, index) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(card.size[0], card.size[1]),
      new THREE.MeshBasicMaterial({
        color: card.color,
        transparent: true,
        opacity: index === 2 ? 0.26 : 0.16,
        side: THREE.DoubleSide,
      }),
    );

    mesh.position.set(card.position[0], card.position[1], card.position[2]);
    mesh.rotation.set(card.rotation[0], card.rotation[1], card.rotation[2]);
    scene.add(mesh);
    glowPlanes.push(mesh);
  });

  const reflectionMaterial = new THREE.MeshStandardMaterial({
    color: 0xfaf2f7,
    envMap: cubeRenderTarget.texture,
    metalness: 1,
    roughness: 0.04,
    transparent: true,
    opacity: 0.96,
  });

  const sideMaterial = new THREE.MeshStandardMaterial({
    color: 0x140d12,
    metalness: 0.16,
    roughness: 0.82,
    transparent: true,
    opacity: 0.84,
  });

  const mirrorPanelData = [
    { size: [2.87, 2.92, 0.05], position: [2.24, -1.56, -3.42], rotation: [1.25, -1.67, -2.84] },
    { size: [1.8, 1.96, 0.05], position: [-2.39, 2.54, -2.8], rotation: [1.4, -0.29, 0.72] },
    { size: [2.88, 2.91, 0.05], position: [0.92, 2.08, -2.72], rotation: [-1.33, 2.8, -0.19] },
    { size: [2.22, 1.38, 0.05], position: [3.28, 0.71, -2.45], rotation: [-2.33, 0.61, -0.39] },
    { size: [1.74, 2.62, 0.05], position: [-2.04, -2.18, -2.3], rotation: [-1.41, 3, 2.54] },
    { size: [1.14, 1.8, 0.05], position: [-0.03, -0.97, -1.02], rotation: [1.28, -0.31, -2.11] },
    { size: [2.2, 2.61, 0.05], position: [-2.99, -0.25, -1.06], rotation: [1.44, 1.82, -2.22] },
    { size: [2.1, 1.58, 0.05], position: [4.72, -1.9, -2.66], rotation: [1.19, 0.53, 0.45] },
    { size: [1.33, 1.52, 0.05], position: [2.64, -2.98, -1.86], rotation: [-0.77, 1.41, 2.03] },
    { size: [5.14, 4.42, 0.05], position: [0.47, 5.1, -3.55], rotation: [-0.07, 1.92, 0.53] },
  ];

  mirrorPanelData.forEach((panel, index) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxBufferGeometry(panel.size[0], panel.size[1], panel.size[2]),
      [sideMaterial, sideMaterial, sideMaterial, sideMaterial, reflectionMaterial, reflectionMaterial],
    );

    mesh.position.set(panel.position[0], panel.position[1], panel.position[2]);
    mesh.rotation.set(panel.rotation[0], panel.rotation[1], panel.rotation[2]);
    mesh.userData.basePosition = mesh.position.clone();
    mesh.userData.baseRotation = mesh.rotation.clone();
    mesh.userData.phase = index * 0.9;
    mesh.userData.parallax = 0.16 + index * 0.01;
    panelGroup.add(mesh);
  });

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.54);
  const keyLight = new THREE.PointLight(0xffffff, 2.4, 40, 2);
  const magentaLight = new THREE.PointLight(0xff77bb, 1.5, 30, 2);
  const blueLight = new THREE.PointLight(0x7a8cff, 1.18, 30, 2);

  keyLight.position.set(4.6, 2.8, 7.2);
  magentaLight.position.set(-4.8, 1.8, 3.6);
  blueLight.position.set(3.2, -3.4, 2.4);

  scene.add(ambientLight, keyLight, magentaLight, blueLight);

  let mouseX = 0;
  let mouseY = 0;
  const targetRotation = { x: 0.02, y: 0.02 };
  const currentRotation = { x: 0.02, y: 0.02 };

  const resize = () => {
    const rect = shell.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  };

  const updatePointer = (event) => {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
    targetRotation.x = mouseY * 0.16;
    targetRotation.y = mouseX * 0.22;
  };

  const renderFrame = (timeMs) => {
    const time = timeMs * 0.001;

    currentRotation.x = lerp(currentRotation.x, targetRotation.x, 0.08);
    currentRotation.y = lerp(currentRotation.y, targetRotation.y, 0.08);

    rootGroup.rotation.x = currentRotation.x;
    rootGroup.rotation.y = currentRotation.y;

    panelGroup.children.forEach((panel, index) => {
      const basePosition = panel.userData.basePosition;
      const baseRotation = panel.userData.baseRotation;
      const phase = panel.userData.phase;
      const parallax = panel.userData.parallax;

      panel.position.x = basePosition.x + Math.sin(time * 0.52 + phase) * 0.12 + mouseX * parallax * 2.6;
      panel.position.y = basePosition.y + Math.cos(time * 0.66 + phase) * 0.13 + mouseY * parallax * 2.1;
      panel.rotation.x = baseRotation.x + Math.sin(time * 0.32 + phase) * 0.05;
      panel.rotation.y = baseRotation.y + time * 0.12 + index * 0.015;
      panel.rotation.z = baseRotation.z + Math.cos(time * 0.36 + phase) * 0.05;
    });

    glowPlanes.forEach((plane, index) => {
      plane.material.opacity = (index === 2 ? 0.24 : 0.16) + Math.sin(time * 0.7 + index) * 0.02;
    });

    room.rotation.y = -time * 0.03;
    ambience.rotation.x = time * 0.02;
    ambience.rotation.y = -time * 0.03;

    panelGroup.visible = false;
    cubeCamera.position.set(0, 0, 0);
    cubeCamera.update(renderer, scene);
    panelGroup.visible = true;

    renderer.render(scene, camera);
  };

  resize();

  if (reduceMotion) {
    renderFrame(0);
  } else {
    renderer.setAnimationLoop(renderFrame);
    window.addEventListener("pointermove", updatePointer);
  }

  window.addEventListener("resize", resize);
}

window.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initReveal();
  initMagnetic();
  initProjectWall();
  initScrollScene();
  initSceneCanvas();
});
