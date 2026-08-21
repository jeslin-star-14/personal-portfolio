// main.js
// Nav behaviour, hero typing effect, scroll reveals, and public portfolio data.

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

async function loadPublicContent() {
  try {
    const res = await fetch("/api/public-content");
    if (!res.ok) throw new Error("Could not load file list.");
    const content = await res.json();
    renderPublicContent(content);
  } catch (_err) {
    document.getElementById("public-files").innerHTML = "";
  }
}

function renderPublicContent({ files, profileImage }) {
  const resume = files.find((file) => file.category === "resume");
  const resumeLink = document.getElementById("resume-link");
  if (resume) {
    resumeLink.href = `/uploads/${encodeURIComponent(resume.stored_name)}`;
    resumeLink.hidden = false;
  }

  const certifications = files.filter((file) => file.category === "certification");
  const certificationList = document.getElementById("certifications-list");
  certificationList.innerHTML = certifications.length
    ? certifications.map((file) => {
      const url = `/uploads/${encodeURIComponent(file.stored_name)}`;
      const preview = file.mime_type?.startsWith("image/")
        ? `<img src="${url}" alt="${escapeHtml(file.title || file.original_name)} certificate preview">`
        : `<iframe src="${url}#toolbar=0&navpanes=0" title="${escapeHtml(file.title || file.original_name)} certificate preview"></iframe>`;
      return `<article class="cert"><a class="cert__preview" href="${url}" target="_blank" rel="noopener">${preview}<span class="cert__open">Open certificate ↗</span></a><div class="cert__body"><strong>${escapeHtml(file.title || file.original_name)}</strong><span>${escapeHtml(file.description || "")}</span></div></article>`;
    }).join("")
    : `<div class="cert">Certifications are being updated.</div>`;

  const publicFiles = files.filter((file) => !["certification", "resume"].includes(file.category));
  const fileListEl = document.getElementById("public-files");
  if (!publicFiles.length) {
    fileListEl.innerHTML = `<p class="mono" style="color:var(--dust);font-size:0.8rem;">No featured uploads yet.</p>`;
  } else {
    fileListEl.innerHTML = publicFiles
      .map(
        (f) => `
      <article class="file-item">
        <span><strong class="file-item__name">${escapeHtml(f.title || f.original_name)}</strong><small>${escapeHtml(f.description || "")}</small></span>
        <span class="file-item__meta">${escapeHtml(f.category)}</span>
      </article>`
      )
      .join("");
  }
  if (profileImage) {
    const image = document.getElementById("profile-image");
    image.src = profileImage;
    image.classList.add("is-loaded");
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadPublicContent();
