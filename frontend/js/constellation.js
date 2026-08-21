// constellation.js
// Renders the skill set as a slowly rotating constellation: a core node
// ("full stack") with skill-stars orbiting it, connected by lines.
// Hovering / tapping a node shows its name in a tooltip.

(function () {
  const canvas = document.getElementById("constellation-canvas");
  const wrap = document.querySelector(".constellation-wrap");
  const tooltip = document.getElementById("constellation-tooltip");
  if (!canvas || !wrap) return;
  const ctx = canvas.getContext("2d");

  const SKILLS = [
    "Java", "Python", "C", "C++", "React", "TypeScript",
    "Tailwind CSS", "PostgreSQL", "MongoDB", "REST APIs",
    "Ubuntu", "SSH", "Git",
  ];

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width, height, dpr;
  let nodes = [];
  let angle = 0;
  let hovered = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = wrap.clientWidth;
    height = wrap.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildNodes();
  }

  function buildNodes() {
    const cx = width / 2;
    const cy = height / 2;
    const radiusBase = Math.min(width, height) * 0.36;
    nodes = SKILLS.map((label, i) => {
      const a = (i / SKILLS.length) * Math.PI * 2;
      const radius = radiusBase * (0.75 + (i % 3) * 0.13);
      return { label, a, radius, size: 3 + (i % 3) };
    });
  }

  function nodePos(node) {
    const cx = width / 2;
    const cy = height / 2;
    const a = node.a + angle;
    return {
      x: cx + Math.cos(a) * node.radius,
      y: cy + Math.sin(a) * node.radius * 0.62,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;

    const positions = nodes.map(nodePos);

    // connecting lines to core
    ctx.strokeStyle = "rgba(124,92,255,0.18)";
    ctx.lineWidth = 1;
    positions.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });

    // faint ring connecting neighboring nodes
    ctx.strokeStyle = "rgba(62,217,199,0.12)";
    ctx.beginPath();
    positions.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();

    // core node
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
    coreGrad.addColorStop(0, "rgba(124,92,255,0.9)");
    coreGrad.addColorStop(1, "rgba(124,92,255,0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eae8f7";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // skill nodes
    positions.forEach((p, i) => {
      const node = nodes[i];
      const isHover = hovered === i;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, isHover ? 18 : 10);
      glow.addColorStop(0, isHover ? "rgba(62,217,199,0.9)" : "rgba(234,232,247,0.55)");
      glow.addColorStop(1, "rgba(234,232,247,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isHover ? 18 : 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isHover ? "#3ed9c7" : "#eae8f7";
      ctx.beginPath();
      ctx.arc(p.x, p.y, node.size, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!prefersReduced) angle += 0.0016;
    requestAnimationFrame(draw);
  }

  function handlePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const positions = nodes.map(nodePos);
    let closest = -1;
    let closestDist = 18;
    positions.forEach((p, i) => {
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d < closestDist) { closestDist = d; closest = i; }
    });
    hovered = closest === -1 ? null : closest;

    if (hovered !== null) {
      const p = positions[hovered];
      tooltip.textContent = nodes[hovered].label;
      tooltip.style.left = p.x + "px";
      tooltip.style.top = p.y + "px";
      tooltip.classList.add("is-visible");
      canvas.style.cursor = "pointer";
    } else {
      tooltip.classList.remove("is-visible");
      canvas.style.cursor = "default";
    }
  }

  canvas.addEventListener("mousemove", (e) => handlePointer(e.clientX, e.clientY));
  canvas.addEventListener("mouseleave", () => {
    hovered = null;
    tooltip.classList.remove("is-visible");
  });
  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (t) handlePointer(t.clientX, t.clientY);
  }, { passive: true });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
})();
