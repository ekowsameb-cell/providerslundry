// Providers Laundry — page interactions
(() => {
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const links = document.getElementById("navLinks");

  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    links.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  burger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // Scroll reveal
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  } else items.forEach((el) => el.classList.add("in"));

  // Hero video: only load/play when motion is OK and the connection isn't constrained
  const video = document.getElementById("adVideo");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ""));
  if (video) {
    if (reduce || saveData) {
      video.removeAttribute("autoplay");
      video.pause();
    } else {
      video.preload = "auto";
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    }
  }

  // Plan buttons pre-select the plan in the pickup form
  const planSelect = document.getElementById("planSelect");
  document.querySelectorAll("[data-plan]").forEach((b) => {
    b.addEventListener("click", () => { planSelect.value = b.dataset.plan + " Plan"; });
  });

  // Pickup date can't be in the past
  const date = document.getElementById("pickupDate");
  if (date) {
    const d = new Date();
    date.min = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  // Pickup form: submit to Netlify Forms without leaving the page
  const form = document.getElementById("pickupForm");
  const ok = document.getElementById("formOk");
  const waConfirm = document.getElementById("waConfirm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    const data = new FormData(form);
    const summary = `Hi Providers Laundry, I'd like a pickup.\nName: ${data.get("name")}\nPhone: ${data.get("phone")}\nLocation: ${data.get("location")}\nService: ${data.get("service")}\nPlan: ${data.get("plan")}\nDate: ${data.get("date") || "any"}\n${data.get("message") || ""}`;
    waConfirm.href = "https://wa.me/233202775247?text=" + encodeURIComponent(summary.trim());
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      if (!res.ok) throw new Error(res.status);
      form.hidden = true;
      ok.hidden = false;
    } catch {
      // Fall back to WhatsApp so the request is never lost
      window.open(waConfirm.href, "_blank", "noopener");
    } finally {
      btn.disabled = false;
    }
  });

  const yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
