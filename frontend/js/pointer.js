const pointer = document.querySelector(".pointer");

if (pointer && window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
  document.body.classList.add("has-pointer");
  window.addEventListener("pointermove", (event) => {
    pointer.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  });
  document.querySelectorAll("a, button, input, textarea, select, [role='button']").forEach((element) => {
    element.addEventListener("pointerenter", () => pointer.classList.add("is-hovering"));
    element.addEventListener("pointerleave", () => pointer.classList.remove("is-hovering"));
  });
}