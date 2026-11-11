document.addEventListener("DOMContentLoaded", () => {
  iniciarCartelera();
  iniciarBuscador();
  iniciarSesionAdmin();
});

const MSG_CAJA = "col-span-full bg-white border-2 border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm";

async function iniciarCartelera() {
  const cont = document.getElementById("contenedor-anuncios");
  const filtro = document.getElementById("filtro-categoria");
  if (!cont) return;

  if (filtro) {
    filtro.innerHTML =
      `<option value="todas">Todas</option>` +
      Object.entries(CATEGORIAS).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
  }

  cont.innerHTML = `<div class="${MSG_CAJA}">Cargando comunicados...</div>`;

  let anuncios = [];
  try {
    anuncios = await listarAnuncios();
  } catch (e) {
    console.error(e);
    cont.innerHTML = `<div class="${MSG_CAJA}">No se pudieron cargar los comunicados. Intente de nuevo más tarde.</div>`;
    return;
  }

  if (filtro) filtro.onchange = () => renderAnuncios(cont, anuncios, filtro.value);
  renderAnuncios(cont, anuncios, "todas");
}

function renderAnuncios(cont, todos, categoria) {
  const lista = categoria === "todas" ? todos : todos.filter(a => a.categoria === categoria);

  if (lista.length === 0) {
    cont.innerHTML = `<div class="${MSG_CAJA}">${todos.length ? "No hay anuncios en esta categoría." : "No hay comunicados publicados en este momento."}</div>`;
    return;
  }

  cont.innerHTML = lista.map(a => {
    const c = CATEGORIAS[a.categoria] || CATEGORIAS.informativo;
    return `
      <div class="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-4 shadow-sm hover:shadow-md transition relative overflow-hidden group">
        <div class="absolute top-0 right-0 ${c.badge} text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
          ${c.label}
        </div>
        <div class="w-10 h-10 rounded-lg ${c.iconBox} flex items-center justify-center">
          <i data-lucide="${c.icon}" class="w-5 h-5"></i>
        </div>
        <div class="space-y-1">
          <span class="text-[11px] font-bold text-gray-400">${esc(formatFecha(a.fecha))}</span>
          <h3 class="font-bold text-base text-gray-900 group-hover:text-[#4c0839] transition">${esc(a.titulo)}</h3>
        </div>
        <p class="text-xs text-gray-600 leading-relaxed">${esc(a.contenido)}</p>
      </div>`;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function iniciarBuscador() {
  const form = document.getElementById("form-consulta");
  const input = document.getElementById("input-documento");
  const res = document.getElementById("resultado-consulta");
  if (!form || !input || !res) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const doc = input.value.replace(/\D/g, "");
    const base = "p-4 rounded-xl text-xs font-medium border ";

    if (!doc) {
      res.className = base + "bg-amber-50 border-amber-200 text-amber-800";
      res.innerHTML = "Por favor, ingrese un número de documento válido.";
      return;
    }

    res.className = base + "bg-gray-50 border-gray-200 text-gray-500";
    res.innerHTML = "Consultando...";

    let b;
    try {
      b = await consultarBeneficiaria(doc);
    } catch (err) {
      console.error(err);
      res.className = base + "bg-red-50 border-red-200 text-red-800";
      res.innerHTML = "No se pudo realizar la consulta. Intente de nuevo más tarde.";
      return;
    }

    if (!b) {
      res.className = base + "bg-red-50 border-red-200 text-red-800 space-y-1";
      res.innerHTML = `
        <strong class="font-bold block">Documento no registrado</strong>
        <span class="text-red-700">Verifique los dígitos ingresados o póngase en contacto con la administración.</span>`;
      return;
    }

    const conPermiso = b.estado === "Con permiso";
    const badge = conPermiso ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-emerald-100 text-emerald-900 border-emerald-300";
    const icono = conPermiso ? "log-out" : "check-circle-2";

    res.className = base + "bg-white border-gray-200 space-y-3";
    res.innerHTML = `
      <div class="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <span class="text-sm font-bold text-gray-900">${esc(b.nombre_corto)}</span>
        <span class="px-3 py-1 rounded-full text-[11px] font-bold border ${badge} flex items-center gap-1.5">
          <i data-lucide="${icono}" class="w-3.5 h-3.5"></i>${esc(b.estado)}
        </span>
      </div>
      <p class="text-xs text-gray-700 leading-relaxed">
        <strong class="text-gray-900">Detalle / Retorno:</strong> ${esc(b.detalle)}
      </p>`;
    if (window.lucide) lucide.createIcons();
  });
}

async function iniciarSesionAdmin() {
  const btn = document.getElementById("btn-sesion");
  const modal = document.getElementById("modal-login");
  if (!btn || !modal) return;

  const texto = document.getElementById("btn-sesion-texto");
  const form = document.getElementById("form-login");
  const err = document.getElementById("login-error");
  const correo = document.getElementById("login-correo");
  const clave = document.getElementById("login-clave");
  const enviar = document.getElementById("btn-login");
  let esAdmin = false;

  const abrir = () => { err.classList.add("hidden"); modal.classList.remove("hidden"); correo.focus(); };
  const cerrar = () => modal.classList.add("hidden");
  const mostrarError = msg => { err.textContent = msg; err.classList.remove("hidden"); };

  btn.addEventListener("click", () => { if (esAdmin) location.href = "admin.html"; else abrir(); });
  document.getElementById("btn-cerrar-login").addEventListener("click", cerrar);
  modal.addEventListener("click", e => { if (e.target === modal) cerrar(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrar(); });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    err.classList.add("hidden");
    enviar.disabled = true;
    try {
      await iniciarSesion(correo.value.trim(), clave.value);
      if (!(await cuentaEsAdmin())) {
        await cerrarSesion();
        mostrarError("Esta cuenta no tiene permisos de administración.");
        return;
      }
      clave.value = "";
      location.href = "admin.html";
    } catch (ex) {
      console.error(ex);
      mostrarError(ex && ex.status === 400
        ? "Correo o contraseña incorrectos."
        : "No se pudo iniciar sesión. Intente de nuevo.");
    } finally {
      enviar.disabled = false;
    }
  });

  if (SUPABASE_CONFIGURADO) {
    try {
      if ((await obtenerSesion()) && (await cuentaEsAdmin())) {
        esAdmin = true;
        texto.textContent = "Panel Admin";
      }
    } catch (e) {}
  }
}