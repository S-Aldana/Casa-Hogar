// ===== Portal público (index.html): cartelera + consulta de beneficiarias =====
document.addEventListener("DOMContentLoaded", async () => {
  await asegurarDB();
  iniciarCartelera();
  iniciarBuscador();
});

function iniciarCartelera() {
  const cont = document.getElementById("contenedor-anuncios");
  const filtro = document.getElementById("filtro-categoria");
  if (!cont) return;

  if (filtro) {
    filtro.innerHTML =
      `<option value="todas">Todas</option>` +
      Object.entries(CATEGORIAS).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
    filtro.onchange = () => renderAnuncios(cont, filtro.value);
  }
  renderAnuncios(cont, "todas");
}

function renderAnuncios(cont, categoria) {
  const todos = obtenerDB().anuncios;
  const lista = categoria === "todas" ? todos : todos.filter(a => a.categoria === categoria);

  if (lista.length === 0) {
    cont.innerHTML = `
      <div class="col-span-full bg-white border-2 border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm">
        ${todos.length ? "No hay anuncios en esta categoría." : "No hay comunicados publicados en este momento."}
      </div>`;
    return;
  }

  cont.innerHTML = lista.map(a => {
    const c = CATEGORIAS[a.categoria];
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

// Nombre abreviado para el público: "Valentina Gómez Aldana" -> "Valentina G."
function nombreCorto(nombre) {
  const p = String(nombre || "").trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[1][0].toUpperCase()}.` : p[0];
}

function iniciarBuscador() {
  const form = document.getElementById("form-consulta");
  const input = document.getElementById("input-documento");
  const res = document.getElementById("resultado-consulta");
  if (!form || !input || !res) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const doc = soloDigitos(input.value);
    const base = "p-4 rounded-xl text-xs font-medium border ";

    if (!doc) {
      res.className = base + "bg-amber-50 border-amber-200 text-amber-800";
      res.innerHTML = "Por favor, ingrese un número de documento válido.";
      return;
    }

    const b = obtenerDB().beneficiarias.find(x => soloDigitos(x.documento) === doc);

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
        <span class="text-sm font-bold text-gray-900">${esc(nombreCorto(b.nombre))}</span>
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