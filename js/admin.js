
"use strict";

// ============================================================
// LAS RECETAS DE GIA GIA
// ADMINISTRADOR DE CONTENIDOS
// ============================================================

const DATA_URL = "data/contenido.json";

let contenido = null;
let recetaSeleccionada = null;

const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------
// UTILIDADES
// ------------------------------------------------------------

function informar(mensaje, tipo = "") {
  const caja = $("admin-status");
  if (!caja) return;

  caja.textContent = mensaje;
  caja.className = `admin-status ${tipo}`;
}

function escapar(valor = "") {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarEstado(receta) {
  if (["borrador", "publicada", "pausada"].includes(receta.estadoPublicacion)) {
    return receta.estadoPublicacion;
  }

  // No confundimos el campo "estado" anterior con el editorial.
  return "borrador";
}

function normalizarDatos(datos) {
  if (!datos || typeof datos !== "object") {
    throw new Error("El archivo no contiene un objeto JSON válido.");
  }

  const secciones = [
    "recetas",
    "bebidas",
    "publicaciones",
    "eventos",
    "reconocimientos"
  ];

  secciones.forEach(nombre => {
    if (!Array.isArray(datos[nombre])) {
      datos[nombre] = [];
    }
  });

  datos.recetas.forEach(receta => {
    receta.estadoPublicacion = normalizarEstado(receta);

    if (!Array.isArray(receta.ingredientes)) receta.ingredientes = [];
    if (!Array.isArray(receta.preparacion)) receta.preparacion = [];
    if (!Array.isArray(receta.bebidas)) receta.bebidas = [];

    if (!receta.historia || typeof receta.historia !== "object") {
      receta.historia = { titulo: "", texto: "" };
    }
  });

  return datos;
}

// ------------------------------------------------------------
// NAVEGACIÓN Y PIE
// ------------------------------------------------------------

function construirNavegacion() {
  $("site-header").innerHTML = `
    <nav class="navbar">
      <a class="brand" href="index.html">
        <span class="brand-symbol">ΓΓ</span>
        <span class="brand-name">
          Las Recetas de Gia Gia
          <small>EL SABOR DE GRECIA</small>
        </span>
      </a>

      <div class="nav-links">
        <a href="index.html">Inicio</a>
        <a href="recetario.html">Recetario</a>
        <a href="seccion.html?tipo=bebidas">Bebidas</a>
      </div>
    </nav>
  `;
}

function construirPie() {
  $("site-footer").innerHTML = `
    <div class="site-footer">
      <h2>Las Recetas de Gia Gia</h2>
      <p>Sabores, historias y tradiciones de Grecia.</p>
      <p class="footer-motto">El sabor debe ser auténtico.</p>
      <p>© ${new Date().getFullYear()} Las Recetas de Gia Gia</p>
    </div>
  `;
}

// ------------------------------------------------------------
// CARGAR CONTENIDO
// ------------------------------------------------------------

async function cargarJSON() {
  try {
    const respuesta = await fetch(DATA_URL);

    if (!respuesta.ok) {
      throw new Error("No se pudo acceder a data/contenido.json.");
    }

    const datos = await respuesta.json();
    contenido = normalizarDatos(datos);

    recetaSeleccionada = null;

    actualizarPanel();
    limpiarFormulario();
    informar(
      "Contenido cargado correctamente. Las recetas existentes se conservan como borradores.",
      "success"
    );

  } catch (error) {
    informar(
      error.message + " Abre el administrador mediante un servidor local.",
      "error"
    );
  }
}

// ------------------------------------------------------------
// ESTADÍSTICAS
// ------------------------------------------------------------

function actualizarEstadisticas() {
  if (!contenido) return;

  const recetas = contenido.recetas;

  $("stat-total").textContent = recetas.length;
  $("stat-published").textContent =
    recetas.filter(r => normalizarEstado(r) === "publicada").length;
  $("stat-draft").textContent =
    recetas.filter(r => normalizarEstado(r) === "borrador").length;
  $("stat-paused").textContent =
    recetas.filter(r => normalizarEstado(r) === "pausada").length;
}

// ------------------------------------------------------------
// LISTADO DE RECETAS
// ------------------------------------------------------------

function actualizarListaRecetas() {
  if (!contenido) return;

  const lista = $("recipe-admin-list");
  const texto = $("admin-search").value.toLowerCase().trim();
  const estado = $("admin-filter-status").value;
  const categoria = $("admin-filter-category").value;

  const recetas = contenido.recetas.filter(receta => {
    const coincideTexto = [
      receta.id,
      receta.nombre,
      receta.nombreGriego,
      receta.descripcion
    ].join(" ").toLowerCase().includes(texto);

    const coincideEstado =
      estado === "todos" || normalizarEstado(receta) === estado;

    const coincideCategoria =
      categoria === "todos" ||
      (receta.categoriaId || receta.categoria) === categoria;

    return coincideTexto && coincideEstado && coincideCategoria;
  });

  if (!recetas.length) {
    lista.innerHTML = `
      <div class="empty-state">
        No hay recetas que coincidan con los filtros seleccionados.
      </div>
    `;
    return;
  }

  lista.innerHTML = recetas.map(receta => {
    const estadoActual = normalizarEstado(receta);

    return `
      <article class="admin-recipe-item">

        <div class="admin-recipe-info">
          <strong>${escapar(receta.nombre)}</strong>

          <small>
            ${escapar(receta.categoria || "Sin categoría")}
            · ${escapar(receta.id)}
          </small>

          <span class="admin-status-label status-${estadoActual}">
            ${estadoActual.toUpperCase()}
          </span>
        </div>

        <div class="admin-recipe-actions">

          <button
            type="button"
            class="btn btn-outline"
            data-action="edit"
            data-id="${escapar(receta.id)}">
            Editar
          </button>

          <button
            type="button"
            class="btn btn-outline"
            data-action="toggle"
            data-id="${escapar(receta.id)}">
            ${estadoActual === "pausada" ? "Reactivar" : "Pausar"}
          </button>

          <button
            type="button"
            class="btn btn-outline"
            data-action="delete"
            data-id="${escapar(receta.id)}">
            Eliminar
          </button>

        </div>
      </article>
    `;
  }).join("");
}

function actualizarPanel() {
  actualizarEstadisticas();
  actualizarListaRecetas();
  actualizarBebidas();
}

// ------------------------------------------------------------
// INGREDIENTES DINÁMICOS
// ------------------------------------------------------------

function agregarIngrediente(datos = {}) {
  const contenedor = $("ingredients-editor");

  const fila = document.createElement("div");
  fila.className = "admin-dynamic-row ingredient-row";

  fila.innerHTML = `
    <input
      type="text"
      class="ingredient-quantity"
      placeholder="Cantidad"
      value="${escapar(datos.cantidad || "")}"
      aria-label="Cantidad">

    <input
      type="text"
      class="ingredient-name"
      placeholder="Ingrediente"
      value="${escapar(datos.nombre || "")}"
      aria-label="Ingrediente">

    <input
      type="text"
      class="ingredient-unit"
      placeholder="Unidad (opcional)"
      value="${escapar(datos.unidad || "")}"
      aria-label="Unidad">

    <button
      type="button"
      class="btn-remove-row"
      aria-label="Eliminar ingrediente">
      ×
    </button>
  `;

  contenedor.appendChild(fila);
}

function leerIngredientes() {
  return [...document.querySelectorAll(".ingredient-row")]
    .map(fila => {
      const ingrediente = {
        cantidad: fila.querySelector(".ingredient-quantity").value.trim(),
        nombre: fila.querySelector(".ingredient-name").value.trim()
      };

      const unidad = fila.querySelector(".ingredient-unit").value.trim();

      if (unidad) ingrediente.unidad = unidad;

      return ingrediente;
    })
    .filter(item => item.nombre || item.cantidad);
}

// ------------------------------------------------------------
// PASOS DE PREPARACIÓN
// ------------------------------------------------------------

function agregarPaso(texto = "") {
  const contenedor = $("steps-editor");

  const fila = document.createElement("div");
  fila.className = "admin-dynamic-row step-row";

  fila.innerHTML = `
    <textarea
      class="step-text"
      rows="2"
      placeholder="Describe este paso...">${escapar(texto)}</textarea>

    <button
      type="button"
      class="btn-remove-row"
      aria-label="Eliminar paso">
      ×
    </button>
  `;

  contenedor.appendChild(fila);
}

function leerPreparacion() {
  return [...document.querySelectorAll(".step-row .step-text")]
    .map(campo => campo.value.trim())
    .filter(Boolean);
}

// ------------------------------------------------------------
// BEBIDAS
// ------------------------------------------------------------

function actualizarBebidas(seleccionadas = null) {
  const contenedor = $("recipe-drinks");

  if (!contenido || !contenido.bebidas.length) {
    contenedor.innerHTML = `
      <p class="help-text">Todavía no hay bebidas en el catálogo.</p>
    `;
    return;
  }

  const seleccion = seleccionadas || [];

  contenedor.innerHTML = contenido.bebidas.map(bebida => `
    <label class="admin-check-item">
      <input
        type="checkbox"
        name="recipe-drink"
        value="${escapar(bebida.id)}"
        ${seleccion.includes(bebida.id) ? "checked" : ""}>
      <span>${escapar(bebida.nombre)}</span>
    </label>
  `).join("");
}

function leerBebidas() {
  return [...document.querySelectorAll(
    'input[name="recipe-drink"]:checked'
  )].map(campo => campo.value);
}

// ------------------------------------------------------------
// FORMULARIO
// ------------------------------------------------------------

function limpiarFormulario() {
  $("recipe-form").reset();

  $("recipe-id").disabled = false;
  $("recipe-status").value = "borrador";
  $("recipe-featured").value = "false";
  $("recipe-tip-validated").value = "false";

  $("ingredients-editor").innerHTML = "";
  $("steps-editor").innerHTML = "";

  agregarIngrediente();
  agregarPaso();

  actualizarBebidas([]);

  recetaSeleccionada = null;

  $("editor-title").textContent = "Nueva receta";
  $("editor-mode").textContent = "Nueva receta";
  $("save-recipe").textContent = "Guardar receta";
}

function cargarFormulario(receta) {
  limpiarFormulario();

  recetaSeleccionada = receta.id;

  $("recipe-id").value = receta.id || "";
  $("recipe-id").disabled = true;

  $("recipe-name").value = receta.nombre || "";
  $("recipe-greek").value = receta.nombreGriego || "";
  $("recipe-category").value =
    receta.categoriaId || receta.categoria || "entrada";

  $("recipe-region").value = receta.region || "";
  $("recipe-status").value = normalizarEstado(receta);
  $("recipe-featured").value = String(Boolean(receta.destacada));
  $("recipe-tags").value = Array.isArray(receta.etiquetas)
    ? receta.etiquetas.join(", ")
    : "";

  $("recipe-description").value = receta.descripcion || "";

  $("recipe-story-title").value = receta.historia?.titulo || "";
  $("recipe-story-text").value = receta.historia?.texto || "";

  $("recipe-servings").value = receta.porciones || 4;
  $("recipe-difficulty").value = receta.dificultad || "";
  $("recipe-prep-time").value = receta.tiempoPreparacion || "";
  $("recipe-cook-time").value = receta.tiempoCoccion || "";
  $("recipe-total-time").value = receta.tiempoTotal || "";

  $("ingredients-editor").innerHTML = "";
  (receta.ingredientes || []).forEach(agregarIngrediente);

  if (!receta.ingredientes?.length) agregarIngrediente();

  $("steps-editor").innerHTML = "";
  (receta.preparacion || []).forEach(agregarPaso);

  if (!receta.preparacion?.length) agregarPaso();

  $("recipe-image").value = receta.imagen || "";

  $("recipe-gallery").value = Array.isArray(receta.galeria)
    ? receta.galeria.join("\n")
    : "";

  $("recipe-tip").value = receta.consejo || "";
  $("recipe-tip-validated").value =
    String(Boolean(receta.consejoValidado));

  $("recipe-accompaniment").value = receta.acompanamiento || "";

  $("recipe-source-name").value = receta.fuente?.nombre || "";
  $("recipe-source-url").value = receta.fuente?.url || "";
  $("recipe-notes").value = receta.notas || "";

  actualizarBebidas(receta.bebidas || []);

  $("editor-title").textContent = receta.nombre;
  $("editor-mode").textContent = "Editando receta";
  $("save-recipe").textContent = "Guardar cambios";

  $("recipe-editor").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// ------------------------------------------------------------
// GUARDAR RECETA
// ------------------------------------------------------------

function guardarReceta(evento) {
  evento.preventDefault();

  if (!contenido) {
    informar("Primero debes cargar el contenido JSON.", "error");
    return;
  }

  const id = $("recipe-id").value.trim().toLowerCase();

  if (!/^[a-z0-9-]+$/.test(id)) {
    informar(
      "El identificador debe usar minúsculas, números y guiones.",
      "error"
    );
    return;
  }

  const existente = contenido.recetas.find(r => r.id === id);

  if (existente && !recetaSeleccionada) {
    informar("Ya existe una receta con ese identificador.", "error");
    return;
  }

  const original = recetaSeleccionada
    ? contenido.recetas.find(r => r.id === recetaSeleccionada)
    : {};

  const categoria = $("recipe-category").value;

  const nuevaReceta = {
    ...original,

    id,
    nombre: $("recipe-name").value.trim(),
    nombreGriego: $("recipe-greek").value.trim(),

    categoria,
    categoriaId: categoria,

    region: $("recipe-region").value.trim(),

    etiquetas: $("recipe-tags").value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean),

    estadoPublicacion: $("recipe-status").value,
    destacada: $("recipe-featured").value === "true",

    descripcion: $("recipe-description").value.trim(),

    historia: {
      ...(original.historia || {}),
      titulo: $("recipe-story-title").value.trim(),
      texto: $("recipe-story-text").value.trim()
    },

    porciones: Number($("recipe-servings").value) || 4,
    dificultad: $("recipe-difficulty").value,

    tiempoPreparacion: $("recipe-prep-time").value.trim(),
    tiempoCoccion: $("recipe-cook-time").value.trim(),
    tiempoTotal: $("recipe-total-time").value.trim(),

    ingredientes: leerIngredientes(),
    preparacion: leerPreparacion(),

    imagen: $("recipe-image").value.trim(),

    galeria: $("recipe-gallery").value
      .split("\n")
      .map(ruta => ruta.trim())
      .filter(Boolean),

    consejo: $("recipe-tip").value.trim(),
    consejoValidado: $("recipe-tip-validated").value === "true",

    acompanamiento: $("recipe-accompaniment").value.trim(),

    bebidas: leerBebidas(),

    fuente: {
      ...(original.fuente || {}),
      nombre: $("recipe-source-name").value.trim(),
      url: $("recipe-source-url").value.trim()
    },

    notas: $("recipe-notes").value.trim()
  };

  if (recetaSeleccionada) {
    const indice = contenido.recetas.findIndex(
      r => r.id === recetaSeleccionada
    );

    contenido.recetas[indice] = nuevaReceta;

    informar("Receta actualizada correctamente.", "success");

  } else {
    contenido.recetas.push(nuevaReceta);

    informar("Nueva receta agregada correctamente.", "success");
  }

  actualizarPanel();
  limpiarFormulario();
}

// ------------------------------------------------------------
// PAUSAR Y REACTIVAR
// ------------------------------------------------------------

function cambiarEstado(id) {
  const receta = contenido.recetas.find(r => r.id === id);
  if (!receta) return;

  const estadoActual = normalizarEstado(receta);

  receta.estadoPublicacion =
    estadoActual === "pausada" ? "borrador" : "pausada";

  actualizarPanel();

  informar(
    receta.estadoPublicacion === "pausada"
      ? "La receta quedó pausada."
      : "La receta fue reactivada como borrador.",
    "success"
  );
}

// ------------------------------------------------------------
// ELIMINAR
// ------------------------------------------------------------

function eliminarReceta(id) {
  const receta = contenido.recetas.find(r => r.id === id);
  if (!receta) return;

  const confirmar = window.confirm(
    `¿Deseas eliminar la receta "${receta.nombre}"?\n\nEsta acción se conservará únicamente si exportas el JSON actualizado.`
  );

  if (!confirmar) return;

  contenido.recetas = contenido.recetas.filter(r => r.id !== id);

  if (recetaSeleccionada === id) limpiarFormulario();

  actualizarPanel();

  informar("Receta eliminada del contenido local.", "success");
}

// ------------------------------------------------------------
// VALIDACIÓN DEL CONTENIDO
// ------------------------------------------------------------

function validarJSON() {
  if (!contenido) {
    informar("Primero carga o importa un archivo JSON.", "error");
    return false;
  }

  try {
    const ids = contenido.recetas.map(r => r.id);

    if (new Set(ids).size !== ids.length) {
      throw new Error("Hay identificadores de recetas duplicados.");
    }

    for (const receta of contenido.recetas) {
      if (!receta.id || !receta.nombre || !receta.descripcion) {
        throw new Error(
          "Una receta tiene incompleto su identificador, nombre o descripción."
        );
      }

      if (!Array.isArray(receta.ingredientes)) {
        throw new Error(`Ingredientes inválidos en ${receta.nombre}.`);
      }

      if (!Array.isArray(receta.preparacion)) {
        throw new Error(`Preparación inválida en ${receta.nombre}.`);
      }

      if (!["borrador", "publicada", "pausada"].includes(
        normalizarEstado(receta)
      )) {
        throw new Error(`Estado editorial inválido en ${receta.nombre}.`);
      }

      for (const bebidaId of receta.bebidas || []) {
        if (!contenido.bebidas.some(b => b.id === bebidaId)) {
          throw new Error(
            `La bebida "${bebidaId}" de ${receta.nombre} no existe en el catálogo.`
          );
        }
      }
    }

    informar(
      `Validación correcta: ${contenido.recetas.length} recetas, ${contenido.bebidas.length} bebidas y estructura general válida.`,
      "success"
    );

    return true;

  } catch (error) {
    informar("Error de validación: " + error.message, "error");
    return false;
  }
}

// ------------------------------------------------------------
// IMPORTAR JSON
// ------------------------------------------------------------

function importarArchivo(archivo) {
  if (!archivo) return;

  const lector = new FileReader();

  lector.onload = evento => {
    try {
      const datos = JSON.parse(evento.target.result);

      contenido = normalizarDatos(datos);

      recetaSeleccionada = null;

      actualizarPanel();
      limpiarFormulario();

      informar(
        "Archivo importado correctamente. Revisa y valida antes de exportar.",
        "success"
      );

    } catch (error) {
      informar("No se pudo importar el archivo: " + error.message, "error");
    }
  };

  lector.onerror = () => {
    informar("No fue posible leer el archivo seleccionado.", "error");
  };

  lector.readAsText(archivo, "UTF-8");
}

// ------------------------------------------------------------
// EXPORTAR JSON
// ------------------------------------------------------------

function exportarJSON() {
  if (!contenido) {
    informar("Primero carga o importa el contenido.", "error");
    return;
  }

  if (!validarJSON()) return;

  const contenidoTexto = JSON.stringify(contenido, null, 2);

  const archivo = new Blob(
    [contenidoTexto],
    { type: "application/json;charset=utf-8" }
  );

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = "contenido.json";

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url);

  informar(
    "Archivo contenido.json exportado. Ya puedes sustituirlo en GitHub.",
    "success"
  );
}

// ------------------------------------------------------------
// EVENTOS DE LA INTERFAZ
// ------------------------------------------------------------

function configurarEventos() {

  $("load-json").addEventListener("click", cargarJSON);

  $("validate-json").addEventListener("click", validarJSON);

  $("download-json").addEventListener("click", exportarJSON);

  $("json-file").addEventListener("change", evento => {
    importarArchivo(evento.target.files[0]);
    evento.target.value = "";
  });

  $("new-recipe").addEventListener("click", () => {
    limpiarFormulario();

    $("recipe-editor").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  $("recipe-form").addEventListener("submit", guardarReceta);

  $("cancel-edit").addEventListener("click", limpiarFormulario);

  $("add-ingredient").addEventListener("click", () => {
    agregarIngrediente();
  });

  $("add-step").addEventListener("click", () => {
    agregarPaso();
  });

  $("ingredients-editor").addEventListener("click", evento => {
    if (evento.target.classList.contains("btn-remove-row")) {
      evento.target.closest(".ingredient-row").remove();
    }
  });

  $("steps-editor").addEventListener("click", evento => {
    if (evento.target.classList.contains("btn-remove-row")) {
      evento.target.closest(".step-row").remove();
    }
  });

  $("recipe-admin-list").addEventListener("click", evento => {
    const boton = evento.target.closest("button[data-action]");
    if (!boton || !contenido) return;

    const id = boton.dataset.id;
    const accion = boton.dataset.action;

    if (accion === "edit") {
      const receta = contenido.recetas.find(r => r.id === id);
      if (receta) cargarFormulario(receta);
    }

    if (accion === "toggle") {
      cambiarEstado(id);
    }

    if (accion === "delete") {
      eliminarReceta(id);
    }
  });

  $("admin-search").addEventListener("input", actualizarListaRecetas);

  $("admin-filter-status").addEventListener(
    "change",
    actualizarListaRecetas
  );

  $("admin-filter-category").addEventListener(
    "change",
    actualizarListaRecetas
  );
}

// ------------------------------------------------------------
// INICIO
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  construirNavegacion();
  construirPie();

  configurarEventos();
  limpiarFormulario();

  informar(
    "Administrador listo. Pulsa «Cargar contenido publicado» para comenzar."
  );
});
