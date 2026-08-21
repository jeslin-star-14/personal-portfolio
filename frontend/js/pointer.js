const pointer = document.querySelector(".pointer");

if (pointer && window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
  const glitterTargets = ".hero__profile, .cert__preview, .project-card";
  let lastGlitter = 0;

  document.body.classList.add("has-pointer");
  window.addEventListener("pointermove", (event) => {
    pointer.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    const target = event.target.closest?.(glitterTargets);
    document.querySelectorAll(glitterTargets).forEach((element) => {
      element.classList.toggle("is-glowing", element === target);
    });

    if (target && event.timeStamp - lastGlitter > 75) {
      lastGlitter = event.timeStamp;
      const sparkle = document.createElement("i");
      sparkle.className = "glitter-spark";
      sparkle.style.left = `${event.clientX}px`;
      sparkle.style.top = `${event.clientY}px`;
      sparkle.style.setProperty("--spark-size", `${Math.round(3 + Math.random() * 5)}px`);
      sparkle.style.setProperty("--spark-color", Math.random() > 0.5 ? "var(--cyan)" : "var(--pink)");
      document.body.appendChild(sparkle);
      sparkle.addEventListener("animationend", () => sparkle.remove(), { once: true });
    }
  });
  document.querySelectorAll("a, button, input, textarea, select, [role='button']").forEach((element) => {
    element.addEventListener("pointerenter", () => pointer.classList.add("is-hovering"));
    element.addEventListener("pointerleave", () => pointer.classList.remove("is-hovering"));
  });
}