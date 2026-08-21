// galaxy.js
// Full-page starfield: layered parallax stars that drift with the mouse,
// plus occasional shooting stars. Respects prefers-reduced-motion by
// rendering a single static frame instead of looping.

(function () {
  const canvas = document.getElementById("galaxy-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width, height, dpr;
  let stars = [];
  let shootingStars = [];
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;

  const STAR_COUNT = () => Math.floor((width * height) / 9000);
  const LAYERS = [
    { speed: 0.15, size: [0.5, 1.1], alpha: [0.3, 0.6] },
    { speed: 0.35, size: [0.8, 1.6], alpha: [0.5, 0.85] },
    { speed: 0.6,  size: [1.2, 2.2], alpha: [0.7, 1] },
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
  }

  function buildStars() {
    stars = [];
    const total = STAR_COUNT();
    for (let i = 0; i < total; i++) {
      const layer = LAYERS[i % LAYERS.length];
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: rand(layer.size[0], layer.size[1]),
        a: rand(layer.alpha[0], layer.alpha[1]),
        speed: layer.speed,
        twinkleSpeed: rand(0.5, 2),
        twinklePhase: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.15 ? (Math.random() < 0.5 ? "cyan" : "violet") : "white",
      });
    }
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  function colorFor(star, alpha) {
    if (star.hue === "cyan") return `rgba(62,217,199,${alpha})`;
    if (star.hue === "violet") return `rgba(124,92,255,${alpha})`;
    return `rgba(234,232,247,${alpha})`;
  }

  function maybeSpawnShootingStar() {
    if (Math.random() < 0.006 && shootingStars.length < 2) {
      const startX = rand(width * 0.1, width * 0.9);
      const startY = rand(0, height * 0.3);
      shootingStars.push({
        x: startX, y: startY,
        vx: rand(4, 8), vy: rand(2, 4),
        life: 1,
      });
    }
  }

  function drawShootingStars() {
    shootingStars.forEach((s) => {
      ctx.save();
      ctx.strokeStyle = `rgba(234,232,247,${s.life})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
      ctx.stroke();
      ctx.restore();
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.02;
    });
    shootingStars = shootingStars.filter((s) => s.life > 0 && s.x < width + 50 && s.y < height + 50);
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, width, height);

    mouseX += (targetMouseX - mouseX) * 0.03;
    mouseY += (targetMouseY - mouseY) * 0.03;

    stars.forEach((star) => {
      const parallaxX = (mouseX - width / 2) * star.speed * 0.02;
      const parallaxY = (mouseY - height / 2) * star.speed * 0.02;
      const twinkle = 0.65 + 0.35 * Math.sin(frame * 0.02 * star.twinkleSpeed + star.twinklePhase);
      ctx.beginPath();
      ctx.fillStyle = colorFor(star, star.a * twinkle);
      ctx.arc(star.x + parallaxX, star.y + parallaxY, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    maybeSpawnShootingStar();
    drawShootingStars();

    frame++;
    requestAnimationFrame(draw);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach((star) => {
      ctx.beginPath();
      ctx.fillStyle = colorFor(star, star.a);
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  window.addEventListener("resize", () => {
    resize();
    if (prefersReduced) drawStatic();
  });

  window.addEventListener("mousemove", (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  });

  resize();
  if (prefersReduced) {
    drawStatic();
  } else {
    requestAnimationFrame(draw);
  }
})();
