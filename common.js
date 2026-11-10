// ===== Capa de datos y utilidades compartidas (index.html + admin.html) =====
// Conexión a Supabase. Requiere cargar antes la librería:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// 1) PEGA AQUÍ los datos de tu proyecto (Project Settings → API)
const SUPABASE_URL = "https://uklzdymjucqchmqzkusp.supabase.co";
const SUPABASE_KEY = "sb_publishable_XpDcLabmx24ZihyonSWQIw_6vjucISh";
// ¡NUNCA pongas aquí la clave "secret"! Solo la "publishable".

const SUPABASE_CONFIGURADO = !SUPABASE_URL.includes("TU-PROYECTO") && !SUPABASE_KEY.includes("PEGA_AQUI");
const sb = (SUPABASE_CONFIGURADO && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

function cliente() {
  if (!sb) throw new Error("Falta configurar la URL y la clave de Supabase en common.js");
  return sb;
}

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

// "2026-11-15" -> "15 de Noviembre, 2026". Si es texto libre, lo deja igual.
function formatFecha(f) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f || "");
  if (!m) return f || "";
  return `${parseInt(m[3], 10)} de ${MESES[parseInt(m[2], 10) - 1]}, ${m[1]}`;
}

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------- Datos (todas devuelven una promesa y lanzan error si algo falla) ----------

async function listarAnuncios() {
  const { data, error } = await cliente().from("anuncios").select("*").order("id", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function crearAnuncio(a) {
  const { error } = await cliente().from("anuncios").insert(a);
  if (error) throw error;
}

async function eliminarAnuncioDB(id) {
  const { error } = await cliente().from("anuncios").delete().eq("id", id);
  if (error) throw error;
}

async function listarBeneficiarias() {
  const { data, error } = await cliente().from("beneficiarias").select("*").order("nombre", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function crearBeneficiaria(b) {
  const { error } = await cliente().from("beneficiarias").insert(b);
  if (error) throw error;
}

async function actualizarBeneficiaria(documentoOriginal, b) {
  const { error } = await cliente().from("beneficiarias").update(b).eq("documento", documentoOriginal);
  if (error) throw error;
}

async function eliminarBeneficiariaDB(documento) {
  const { error } = await cliente().from("beneficiarias").delete().eq("documento", documento);
  if (error) throw error;
}

// Consulta pública: devuelve { nombre_corto, estado, detalle } o null si no existe
async function consultarBeneficiaria(documento) {
  const { data, error } = await cliente().rpc("consultar_beneficiaria", { p_documento: documento });
  if (error) throw error;
  return (data && data[0]) || null;
}

// ---------- Sesión de la administradora ----------

async function obtenerSesion() {
  const { data } = await cliente().auth.getSession();
  return data.session;
}

async function iniciarSesion(correo, clave) {
  const { error } = await cliente().auth.signInWithPassword({ email: correo, password: clave });
  if (error) throw error;
}

async function cerrarSesion() {
  await cliente().auth.signOut();
}

// true solo si la cuenta con sesión está en la lista de es_admin() de la base de datos
async function cuentaEsAdmin() {
  const { data, error } = await cliente().rpc("es_admin");
  return !error && data === true;
}