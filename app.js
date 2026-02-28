// ==========================================================
// FUERZA (CQ)² — app.js (rediseño)
// Calculadora + tabla dinámica + modal de imágenes
// ==========================================================

const LINKS = {
  instagram: "https://www.instagram.com/fuerzaccqq",
  whatsapp: "https://www.whatsapp.com/channel/0029VaVzdrW89ind1cM7Dy44",
  tiktok: "https://www.tiktok.com/@fuerzacccqq",
};

// --- Helpers DOM ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function round2(n){ return Math.round((n + Number.EPSILON) * 100) / 100; }
function format2(n){ return round2(n).toFixed(2); }

// Fórmula del afiche:
// X = (7 - 0.4Y) / 0.6
function calcX(y){
  return (7 - 0.4 * y) / 0.6;
}

function parseY(){
  const raw = String($("#promedioInput").value || "").trim().replace(",", ".");
  if (!raw) return null;
  const y = Number(raw);
  if (Number.isNaN(y)) return null;
  return y;
}

function validateY(y){
  if (y === null) return { ok: false, msg: "Ingresa un número (ej: 6.3)." };
  if (y < 0 || y > 10) return { ok: false, msg: "El promedio debe estar entre 0 y 10." };
  return { ok: true, msg: "" };
}

function setLinks(){
  $("#btnInstagram").href = LINKS.instagram;
  $("#btnWhatsApp").href = LINKS.whatsapp;
  $("#btntiktok").href = LINKS.tiktok;
}

function setYear(){
  $("#year").textContent = String(new Date().getFullYear());
}

// --- Mobile nav ---
function initNav(){
  const toggle = $("#navToggle");
  const links = $("#navLinks");

  function close(){
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
function initReveal(){
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)){
    items.forEach(el => el.classList.add("is-visible"));
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

  items.forEach(el => io.observe(el));
}

// --- Counters ---
function initCounters(){
  const nums = $$("[data-count]");
  if (!("IntersectionObserver" in window)){
    nums.forEach(el => (el.textContent = el.getAttribute("data-count") || "0"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = Number(el.getAttribute("data-count"));
      const duration = 900;
      const start = performance.now();

      function tick(t){
        const p = Math.min(1, (t - start) / duration);
        const val = Math.round(target * p);
        el.textContent = String(val);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });

  nums.forEach(n => io.observe(n));
}

// --- Calculator ---
function showResult(y){
  const x = round2(calcX(y));

  $("#resultadoValor").textContent = format2(x);

  const note = $("#resultadoNota");
  if (x > 10){
    note.textContent = "Te sale > 10. Revisa el promedio o la política de tu materia.";
    note.style.color = "rgba(199, 0, 57, .95)";
  } else if (x < 0){
    note.textContent = "Te sale < 0. Revisa el promedio ingresado.";
    note.style.color = "rgba(199, 0, 57, .95)";
  } else {
    note.textContent = `Con Y = ${format2(y)}, necesitas al menos X = ${format2(x)} en recuperación.`;
    note.style.color = "";
  }

  window.__lastY = y;
}

function onCalcular(){
  const y = parseY();
  const v = validateY(y);
  const note = $("#resultadoNota");

  if (!v.ok){
    $("#resultadoValor").textContent = "—";
    note.textContent = v.msg;
    note.style.color = "rgba(124, 92, 255, .95)";
    return;
  }
  showResult(y);
}

function copyResult(){
  const xTxt = $("#resultadoValor").textContent.trim();
  if (!xTxt || xTxt === "—") return;

  const y = window.__lastY;
  const payload = (y != null)
    ? `Promedio (Y): ${format2(y)} | Recuperación mínima (X): ${xTxt}`
    : xTxt;

  navigator.clipboard.writeText(payload).then(() => {
    const btn = $("#btnCopiar");
    const old = btn.textContent;
    btn.textContent = "Copiado ✓";
    setTimeout(() => (btn.textContent = old), 900);
  }).catch(() => {
    alert("No se pudo copiar automáticamente. Copia manualmente el resultado.");
  });
}

function resetAll(){
  $("#promedioInput").value = "";
  $("#resultadoValor").textContent = "—";
  $("#resultadoNota").textContent = "Ingresa un promedio para ver el resultado.";
  $("#resultadoNota").style.color = "";
  $("#tablaDinamica").innerHTML = `<tr><td class="muted" colspan="2">Aún no hay datos. Calcula tu promedio y genera la tabla.</td></tr>`;
  window.__lastY = null;
  window.__lastRows = null;
}

// --- Dynamic table ---
function buildRows(baseY, rango){
  const rows = [];
  const start = clamp(baseY - rango, 0, 10);
  const end = clamp(baseY + rango, 0, 10);

  const start1 = Math.round(start * 10) / 10;
  const end1 = Math.round(end * 10) / 10;

  for (let y = start1; y <= end1 + 1e-9; y = Math.round((y + 0.1) * 10) / 10){
    rows.push({ y: round2(y), x: round2(calcX(y)) });
  }
  return rows;
}

function renderTable(rows, highlightY){
  const tbody = $("#tablaDinamica");
  if (!rows.length){
    tbody.innerHTML = `<tr><td class="muted" colspan="2">Sin datos.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(({y, x}) => {
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

function generateTable(){
  const y = parseY();
  const v = validateY(y);
  const note = $("#resultadoNota");
  if (!v.ok){
    note.textContent = v.msg;
    note.style.color = "rgba(124, 92, 255, .95)";
    return;
  }

  const rango = Number($("#rango").value);
  const rows = buildRows(y, rango);
  renderTable(rows, round2(y));
  window.__lastRows = rows;
}

function downloadCSV(){
  const rows = window.__lastRows;
  const y = window.__lastY;

  if (!rows || !rows.length){
    alert("Primero genera la tabla dinámica.");
    return;
  }

  const lines = [
    "Promedio (Y),Recuperación mínima (X)",
    ...rows.map(r => `${format2(r.y)},${format2(r.x)}`)
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
function openModal({ src, alt, caption }){
  const modal = $("#modal");
  const img = $("#modalImg");
  const cap = $("#modalCaption");

  img.src = src;
  img.alt = alt || "";
  cap.textContent = caption || "";

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(){
  const modal = $("#modal");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function initModal(){
  const modal = $("#modal");
  modal.addEventListener("click", (e) => {
    if (e.target && e.target.hasAttribute("data-close")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    const isOpen = $("#modal").getAttribute("aria-hidden") === "false";
    if (isOpen && e.key === "Escape") closeModal();
  });

  $("#btnOpenPoster").addEventListener("click", () => {
    openModal({
      src: "assets/tabla-notas-minimas.jpg",
      alt: "Tabla de notas mínimas",
      caption: "Tabla de notas mínimas — Examen de recuperación"
    });
  });

  $("#btnOpenLogo").addEventListener("click", () => {
    openModal({
      src: "assets/logo-fuerza-cq2.png",
      alt: "Logo FUERZA (CQ)²",
      caption: "Logo FUERZA (CQ)²"
    });
  });
}

// --- Quick chips ---
function initChips(){
  $$(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      $("#promedioInput").value = btn.getAttribute("data-y");
      onCalcular();
    });
  });
}

// --- Init ---
function init(){
  document.documentElement.classList.add("js");
  setLinks();
  setYear();
  initNav();
  initReveal();
  initCounters();
  initModal();
  initChips();

  $("#btnCalcular").addEventListener("click", onCalcular);
  $("#promedioInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") onCalcular();
  });

  $("#btnCopiar").addEventListener("click", copyResult);
  $("#btnReset").addEventListener("click", resetAll);

  $("#btnGenerarTabla").addEventListener("click", generateTable);
  $("#btnCSV").addEventListener("click", downloadCSV);

  resetAll();
}

document.addEventListener("DOMContentLoaded", init);
