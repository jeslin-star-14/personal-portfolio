// main.js
// Nav behaviour, hero typing effect, scroll reveals, and the Uplink
// section's contact form + file upload (talks to the Express/SQLite API).

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------------------------------------------------------
   Mobile nav toggle
--------------------------------------------------------- */
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("is-open"));
});

/* ---------------------------------------------------------
   Active nav link on scroll
--------------------------------------------------------- */
const sections = document.querySelectorAll("main section[id]");
const navAnchors = document.querySelectorAll("[data-nav]");

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAnchors.forEach((a) => a.classList.remove("active"));
        const match = document.querySelector(`[data-nav][href="#${entry.target.id}"]`);
        if (match) match.classList.add("active");
      }
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);
sections.forEach((s) => navObserver.observe(s));

/* ---------------------------------------------------------
   Hero role typing effect
--------------------------------------------------------- */
const roles = [
  "Full Stack Developer",
  "Software Engineer",
  "API & Server Expert",
  "Freelancer",
  "YouTube Creator",
];
const typedEl = document.getElementById("typed-role");
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (typedEl && !prefersReduced) {
  let roleIndex = 0, charIndex = 0, deleting = false;

  function tick() {
    const current = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex--;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
    }
    setTimeout(tick, deleting ? 35 : 65);
  }
  tick();
} else if (typedEl) {
  typedEl.textContent = roles[0];
}

/* ---------------------------------------------------------
   Scroll reveal
--------------------------------------------------------- */
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealEls.forEach((el) => revealObserver.observe(el));

/* ---------------------------------------------------------
   Contact form -> POST /api/contact
--------------------------------------------------------- */
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");
const contactSubmit = document.getElementById("contact-submit");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById("c-name").value.trim(),
    email: document.getElementById("c-email").value.trim(),
    message: document.getElementById("c-message").value.trim(),
  };

  contactSubmit.disabled = true;
  setStatus(contactStatus, "Transmitting...", null);

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Send failed.");
    setStatus(contactStatus, "Message received. Thank you!", "ok");
    contactForm.reset();
  } catch (err) {
    setStatus(contactStatus, err.message, "error");
  } finally {
    contactSubmit.disabled = false;
  }
});

function setStatus(el, text, state) {
  el.textContent = text;
  if (state) el.setAttribute("data-state", state);
  else el.removeAttribute("data-state");
}

/* ---------------------------------------------------------
   File upload -> POST /api/upload, list -> GET /api/files
--------------------------------------------------------- */
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const uploadStatus = document.getElementById("upload-status");
const fileListEl = document.getElementById("file-list");

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("is-dragover");
  })
);
["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
  })
);
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files?.[0];
  if (file) uploadFile(file);
});
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) uploadFile(file);
  fileInput.value = "";
});

async function uploadFile(file) {
  const MAX = 15 * 1024 * 1024;
  if (file.size > MAX) {
    setStatus(uploadStatus, "File exceeds 15MB limit.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  setStatus(uploadStatus, `Uploading ${file.name}...`, null);

  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error((await res.json()).error || "Upload failed.");
    setStatus(uploadStatus, "File stored and logged to SQLite.", "ok");
    loadFiles();
  } catch (err) {
    setStatus(uploadStatus, err.message, "error");
  }
}

async function loadFiles() {
  try {
    const res = await fetch("/api/files");
    if (!res.ok) throw new Error("Could not load file list.");
    const files = await res.json();
    renderFiles(files);
  } catch (err) {
    // Backend may not be running yet (e.g. static preview) - fail quietly.
    fileListEl.innerHTML = "";
  }
}

function renderFiles(files) {
  if (!files.length) {
    fileListEl.innerHTML = `<p class="mono" style="color:var(--dust);font-size:0.8rem;">No files transmitted yet.</p>`;
    return;
  }
  fileListEl.innerHTML = files
    .map(
      (f) => `
      <div class="file-item" data-id="${f.id}">
        <span class="file-item__name" title="${escapeHtml(f.original_name)}">${escapeHtml(f.original_name)}</span>
        <span class="file-item__meta">${formatBytes(f.size_bytes)}</span>
        <button class="file-item__delete" data-id="${f.id}" aria-label="Delete file">delete</button>
      </div>`
    )
    .join("");

  fileListEl.querySelectorAll(".file-item__delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      try {
        const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed.");
        loadFiles();
      } catch (err) {
        setStatus(uploadStatus, err.message, "error");
      }
    });
  });
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let i = 0, val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadFiles();
