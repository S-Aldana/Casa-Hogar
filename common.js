// ===== Capa de datos y utilidades compartidas (index.html + admin.html) =====
// Por ahora usa localStorage. Al migrar a Supabase, solo se cambia este archivo
// y los handlers del admin.

const DB_KEY = "db_casa_hogar";

// Única fuente de verdad de las categorías de la cartelera:
// el admin las usa en el selector y el index en las tarjetas y el filtro.
const CATEGORIAS = {
  reunion:     { label: "Reunión",     icon: "users",     badge: "bg-gray-800 text-white",      iconBox: "bg-gray-100 text-gray-800" },
  taller:      { label: "Taller",      icon: "book-open", badge: "bg-sky-600 text-white",       iconBox: "bg-sky-100 text-sky-700" },
  evento:      { label: "Evento",      icon: "calendar",  badge: "bg-amber-400 text-[#4c0839]", iconBox: "bg-[#4c0839]/10 text-[#4c0839]" },
  actividad:   { label: "Actividad",   icon: "sparkles",  badge: "bg-emerald-500 text-white",   iconBox: "bg-emerald-100 text-emerald-700" },
  informativo: { label: "Informativo", icon: "megaphone", badge: "bg-[#4c0839] text-white",     iconBox: "bg-amber-100 text-amber-700" }
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// "2026-11-15" -> "15 de Noviembre, 2026". Si es texto libre (datos viejos), lo deja igual.
function formatFecha(f) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f || "");
  if (!m) return f || "";
  return `${parseInt(m[3], 10)} de ${MESES[parseInt(m[2], 10) - 1]}, ${m[1]}`;
}

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const soloDigitos = v => String(v || "").replace(/\D/g, "");

// Completa campos que falten (datos guardados con versiones anteriores)
function normalizarDB(db) {
  db = db || {};
  return {
    anuncios: (db.anuncios || []).map(a => ({
      ...a,
      categoria: CATEGORIAS[a.categoria] ? a.categoria : "informativo"
    })),
    beneficiarias: (db.beneficiarias || []).map(b => ({
      ...b,
      acudiente: b.acudiente || "No asignado",
      telefono: b.telefono || "Sin registrar",
      detalle: b.detalle || "Sin observaciones."
    }))
  };
}

function obtenerDB() {
  try {
    return normalizarDB(JSON.parse(localStorage.getItem(DB_KEY)));
  } catch (e) {
    return normalizarDB(null);
  }
}

function guardarDB(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// Si todavía no hay datos guardados, arranca con data.json (o vacío si no se puede leer)
async function asegurarDB() {
  if (localStorage.getItem(DB_KEY)) return;
  let inicial = { anuncios: [], beneficiarias: [] };
  try {
    const r = await fetch("data.json");
    if (r.ok) inicial = await r.json();
  } catch (e) { /* abierto sin servidor: arranca vacío */ }
  guardarDB(normalizarDB(inicial));
}