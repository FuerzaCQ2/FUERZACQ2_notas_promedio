// ==========================================================
// FUERZA (CQ)² | Calculadora de recuperación mínima
// ==========================================================

const LINKS = {
  instagram: "https://www.instagram.com/fuerzaccqq",
  whatsapp: "https://www.whatsapp.com/channel/0029VaVzdrW89ind1cM7Dy44",
  tiktok: "https://www.tiktok.com/@fuerzacccqq",
};

// --- Helpers DOM ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
function format2(n) { return round2(n).toFixed(2); }

// Fórmula del afiche:
// X = (7 - 0.4Y) / 0.6
function calcX(y) {
  return (7 - 0.4 * y) / 0.6;
}

function parseY() {
  const input = $("#promedioInput");
  if (!input) return null;

  const raw = String(input.value || "").trim().replace(",", ".");
  if (!raw) return null;

  const y = Number(raw);
  if (!Number.isFinite(y)) return null;
  return y;
}

function validateY(y) {
  if (y === null) return { ok: false, msg: "Ingresa un número (ej: 6.3)." };
  if (y < 0 || y > 10) return { ok: false, msg: "El promedio debe estar entre 0 y 10." };
  return { ok: true, msg: "" };
}

function setLinks() {
  const ig = $("#btnInstagram");
  const wa = $("#btnWhatsApp");
  const tk = $("#btnTikTok");     // ✅ recomendado: agrega este id en tu HTML
  const oldCorreo = $("#btnCorreo"); // por si tu HTML aún lo tiene como "Correo"

  if (ig) ig.href = LINKS.instagram;
  if (wa) wa.href = LINKS.whatsapp;

  // Si tienes botón TikTok con id btnTikTok
  if (tk) tk.href = LINKS.tiktok;

  // Si en tu HTML aún existe btnCorreo, lo reutilizamos para TikTok
  if (oldCorreo) oldCorreo.href = LINKS.tiktok;
}

function setYear() {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
}

// --- Mobile nav ---
function initNav() {
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  if (!toggle || !links) return;

  function close() {
    links.classList.remove("show");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("show");
    toggle.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  links.addEventListener("click", (e) => {
    if (e.target && e.target.tagName === "A") close();
  });
}

// --- Reveal animations ---
function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach((el) => io.observe(el));
}

// --- Counters ---
function initCounters() {
  const nums = $$("[data-count]");
  if (!nums.length) return;

  if (!("IntersectionObserver" in window)) {
    nums.forEach((el) => (el.textContent = el.getAttribute("data-count") || "0"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;

      const el = e.target;
      const target = Number(el.getAttribute("data-count"));
      if (!Number.isFinite(target)) return;

      const duration = 900;
      const start = performance.now();

      function tick(t) {
        const p = Math.min(1, (t - start) / duration);
        const val = Math.round(target * p);
        el.textContent = String(val);
        if (p < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });

  nums.forEach((n) => io.observe(n));
}

// --- Calculator ---
function showResult(y) {
  const x = round2(calcX(y));

  const out = $("#resultadoValor");
  const note = $("#resultadoNota");
  if (!out || !note) return;

  out.textContent = format2(x);

  if (x > 10) {
    note.textContent = "Te sale > 10. Revisa el promedio o la política de tu materia.";
    note.style.color = "rgba(199, 0, 57, .95)";
  } else if (x < 0) {
    note.textContent = "Te sale < 0. Revisa el promedio ingresado.";
    note.style.color = "rgba(199, 0, 57, .95)";
  } else {
    note.textContent = `Con Y = ${format2(y)}, necesitas al menos X = ${format2(x)} en recuperación.`;
    note.style.color = "";
  }

  window.__lastY = y;
}

function onCalcular() {
  const y = parseY();
  const v = validateY(y);

  const out = $("#resultadoValor");
  const note = $("#resultadoNota");
  if (!out || !note) return;

  if (!v.ok) {
    out.textContent = "—";
    note.textContent = v.msg;
    note.style.color = "rgba(30, 99, 255, .95)";
    return;
  }

  showResult(y);
}

async function copyResult() {
  const out = $("#resultadoValor");
  if (!out) return;

  const xTxt = out.textContent.trim();
  if (!xTxt || xTxt === "—") return;

  const y = window.__lastY;
  const payload = (y != null)
    ? `Promedio (Y): ${format2(y)} | Recuperación mínima (X): ${xTxt}`
    : xTxt;

  try {
    await navigator.clipboard.writeText(payload);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = payload;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }

  const btn = $("#btnCopiar");
  if (btn) {
    const old = btn.textContent;
    btn.textContent = "Copiado ✓";
    setTimeout(() => (btn.textContent = old), 900);
  }
}

function resetAll() {
  const input = $("#promedioInput");
  const out = $("#resultadoValor");
  const note = $("#resultadoNota");
  const tbody = $("#tablaDinamica");

  if (input) input.value = "";
  if (out) out.textContent = "—";
  if (note) {
    note.textContent = "Ingresa un promedio para ver el resultado.";
    note.style.color = "";
  }
  if (tbody) {
    tbody.innerHTML = `<tr><td class="muted" colspan="2">Aún no hay datos. Calcula tu promedio y genera la tabla.</td></tr>`;
  }

  window.__lastY = null;
  window.__lastRows = null;
}

// --- Dynamic table ---
function buildRows(baseY, rango) {
  const rows = [];
  const start = clamp(baseY - rango, 0, 10);
  const end = clamp(baseY + rango, 0, 10);

  const start1 = Math.round(start * 10) / 10;
  const end1 = Math.round(end * 10) / 10;

  for (let y = start1; y <= end1 + 1e-9; y = Math.round((y + 0.1) * 10) / 10) {
    rows.push({ y: round2(y), x: round2(calcX(y)) });
  }

  return rows;
}

function renderTable(rows, highlightY) {
  const tbody = $("#tablaDinamica");
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td class="muted" colspan="2">Sin datos.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(({ y, x }) => {
    const is = Math.abs(y - highlightY) < 1e-9;
    const tag = is ? `<span class="tagSmall">Tu Y</span>` : "";
    const warn = (x > 10 || x < 0);
    const style = warn ? ` style="color: rgba(199, 0, 57, .95); font-weight: 1000;"` : "";
    return `
      <tr>
        <td><strong>${format2(y)}</strong> ${tag}</td>
        <td${style}>${format2(x)}</td>
      </tr>
    `;
  }).join("");
}

function generateTable() {
  const y = parseY();
  const v = validateY(y);

  const note = $("#resultadoNota");
  if (!note) return;

  if (!v.ok) {
    note.textContent = v.msg;
    note.style.color = "rgba(30, 99, 255, .95)";
    return;
  }

  const rangoSel = $("#rango");
  const rango = rangoSel ? Number(rangoSel.value) : 1;

  const rows = buildRows(y, rango);
  renderTable(rows, round2(y));
  window.__lastRows = rows;
  window.__lastY = y;
}

function downloadCSV() {
  const rows = window.__lastRows;
  const y = window.__lastY;

  if (!rows || !rows.length) {
    alert("Primero genera la tabla dinámica.");
    return;
  }

  const lines = [
    "Promedio (Y),Recuperación mínima (X)",
    ...rows.map((r) => `${format2(r.y)},${format2(r.x)}`)
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  const name = y != null ? `tabla_recuperacion_Y_${format2(y)}.csv` : "tabla_recuperacion.csv";
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

// --- Modal (image zoom) ---
function openModal({ src, alt, caption }) {
  const modal = $("#modal");
  const img = $("#modalImg");
  const cap = $("#modalCaption");
  if (!modal || !img) return;

  img.src = src;
  img.alt = alt || "";
  if (cap) cap.textContent = caption || "";

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = $("#modal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function initModal() {
  const modal = $("#modal");
  if (!modal) return;

  // Cerrar por click
  modal.addEventListener("click", (e) => {
    if (e.target && e.target.hasAttribute("data-close")) closeModal();
  });

  // Cerrar con ESC
  document.addEventListener("keydown", (e) => {
    const isOpen = modal.getAttribute("aria-hidden") === "false";
    if (isOpen && e.key === "Escape") closeModal();
  });

  // Poster (si existe)
  const btnPoster = $("#btnOpenPoster");
  if (btnPoster) {
    btnPoster.addEventListener("click", () => {
      openModal({
        src: "assets/tabla-notas-minimas.jpg",
        alt: "Tabla de notas mínimas",
        caption: "Tabla de notas mínimas — Examen de recuperación"
      });
    });
  }

  // Logo (solo si existe el botón)
  const btnLogo = $("#btnOpenLogo");
  if (btnLogo) {
    btnLogo.addEventListener("click", () => {
      openModal({
        src: "assets/logo-fuerza-cq2.png",
        alt: "Logo FUERZA (CQ)²",
        caption: "Logo FUERZA (CQ)²"
      });
    });
  }
}

// --- Quick chips ---
function initChips() {
  const chips = $$(".chip");
  if (!chips.length) return;

  chips.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = $("#promedioInput");
      if (!input) return;
      input.value = btn.getAttribute("data-y");
      onCalcular();
    });
  });
}

// --- Init ---
function init() {
  document.documentElement.classList.add("js");

  setLinks();
  setYear();

  initNav();
  initReveal();
  initCounters();
  initModal();
  initChips();

  const btnCalcular = $("#btnCalcular");
  if (btnCalcular) btnCalcular.addEventListener("click", onCalcular);

  const input = $("#promedioInput");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onCalcular();
    });
  }

  const btnCopiar = $("#btnCopiar");
  if (btnCopiar) btnCopiar.addEventListener("click", copyResult);

  const btnReset = $("#btnReset");
  if (btnReset) btnReset.addEventListener("click", resetAll);

  const btnGen = $("#btnGenerarTabla");
  if (btnGen) btnGen.addEventListener("click", generateTable);

  const btnCSV = $("#btnCSV");
  if (btnCSV) btnCSV.addEventListener("click", downloadCSV);

  resetAll();
}

document.addEventListener("DOMContentLoaded", init);
