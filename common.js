const SUPABASE_URL = "https://uklzdymjucqchmqzkusp.supabase.co";
const SUPABASE_KEY = "sb_publishable_XpDcLabmx24ZihyonSWQIw_6vjucISh";

const SUPABASE_CONFIGURADO = !SUPABASE_URL.includes("TU-PROYECTO") && !SUPABASE_KEY.includes("PEGA_AQUI");
const sb = (SUPABASE_CONFIGURADO && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

function cliente() {
  if (!sb) throw new Error("Falta configurar la URL y la clave de Supabase en common.js");
  return sb;
}

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

function formatFecha(f) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f || "");
  if (!m) return f || "";
  return `${parseInt(m[3], 10)} de ${MESES[parseInt(m[2], 10) - 1]}, ${m[1]}`;
}

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}


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

async function consultarBeneficiaria(documento) {
  const { data, error } = await cliente().rpc("consultar_beneficiaria", { p_documento: documento });
  if (error) throw error;
  return (data && data[0]) || null;
}


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

async function cuentaEsAdmin() {
  const { data, error } = await cliente().rpc("es_admin");
  return !error && data === true;
}

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menu-movil-btn");
  const menuDropdown = document.getElementById("menu-movil-dropdown");

  if (menuBtn && menuDropdown) {
    menuBtn.addEventListener("click", () => {
      menuDropdown.classList.toggle("hidden");
    });

    const mobileLinks = menuDropdown.querySelectorAll("a, button");
    mobileLinks.forEach(el => {
      el.addEventListener("click", () => {
        if (!el.id.includes("btn-sesion") && !el.id.includes("contacto")) {
          menuDropdown.classList.add("hidden");
        }
      });
    });
  }

  const btnSesionMovil = document.getElementById("btn-sesion-movil");
  const btnSesionEscritorio = document.getElementById("btn-sesion");
  if (btnSesionMovil && btnSesionEscritorio) {
    btnSesionMovil.addEventListener("click", () => {
      btnSesionEscritorio.click();
      menuDropdown.classList.add("hidden");
    });
  }

  const btnContactoMovil = document.getElementById("btn-open-contacto-movil");
  const btnContactoEscritorio = document.getElementById("btn-open-contacto");
  if (btnContactoMovil && btnContactoEscritorio) {
    btnContactoMovil.addEventListener("click", () => {
      btnContactoEscritorio.click();
      menuDropdown.classList.add("hidden");
    });
  }
});