
"use strict";

// ============================================================
// LAS RECETAS DE GIA GIA
// APLICACIÓN DEL SITIO PÚBLICO
// ============================================================

const DATA_URL = "data/contenido.json";

let contenido = null;

const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------
// UTILIDADES
// ------------------------------------------------------------

function escapar(valor = "") {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function recetasPublicadas() {
  if (!contenido) return [];

  return contenido.recetas.filter(
    receta => receta.estadoPublicacion === "publicada"
  );
}

// ------------------------------------------------------------
// VALORACIÓN EDITORIAL DE LAS RECETAS
// ------------------------------------------------------------

function valoracionEditorialHTML(receta, contexto = "card") {
  const estrellas = Number(
    receta.valoracionEditorial?.estrellas
  );

  // Mostrar únicamente valoraciones válidas de 4 o 5 estrellas
  if (![4, 5].includes(estrellas)) {
    return "";
  }

  const estrellasHTML = Array.from(
    { length: 5 },
    (_, i) => `
      <span class="${i < estrellas ? "star-filled" : "star-empty"}"
            aria-hidden="true">
        ${i < estrellas ? "★" : "☆"}
      </span>
    `
  ).join("");

  return `
    <div class="editorial-rating editorial-rating--${contexto}"
         role="img"
         aria-label="Valoración editorial: ${estrellas} de 5 estrellas">

      <span class="editorial-stars">
        ${estrellasHTML}
      </span>

      <span class="editorial-rating-label">
        Valoración editorial
      </span>

    </div>
  `;
}

// ------------------------------------------------------------
// CARGA DEL CONTENIDO
// ------------------------------------------------------------

async function cargarContenido() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error("No fue posible cargar contenido.json");
    }

    contenido = await response.json();

    iniciarPagina();

  } catch (error) {
    console.error(error);

    document.querySelector("main")?.insertAdjacentHTML(
      "beforeend",
      '<div class="empty-state">No fue posible cargar el contenido. Revisa la carpeta data.</div>'
    );
  }
}

// ------------------------------------------------------------
// INICIO DE LA PÁGINA
// ------------------------------------------------------------

function iniciarPagina() {
  construirNavegacion();
  construirPie();

  const pagina = document.body.dataset.page;

  if (pagina === "inicio") mostrarInicio();
  if (pagina === "recetario") mostrarRecetario();
  if (pagina === "receta") mostrarReceta();
  if (pagina === "seccion") mostrarSeccion();
}

// ------------------------------------------------------------
// NAVEGACIÓN
// ------------------------------------------------------------

function construirNavegacion() {
  $("site-header").innerHTML = `
    <nav class="navbar">

      <a class="brand" href="index.html">
        <span class="brand-symbol">ΓΓ</span>

        <span class="brand-name">
          Las Recetas de Gia Gia
          <small>EL SABOR DEBE SER AUTÉNTICO · EL SABOR DE GRECIA</small>
        </span>
      </a>

      <div class="nav-links">
        <a href="index.html">Inicio</a>
        <a href="seccion.html?tipo=gia-gia">Gia Gia</a>
        <a href="recetario.html">Recetario</a>
        <a href="seccion.html?tipo=publicaciones">Publicaciones</a>
        <a href="seccion.html?tipo=eventos">Eventos</a>
        <a href="seccion.html?tipo=reconocimientos">Reconocimientos</a>
        <a href="seccion.html?tipo=bebidas">Bebidas</a>
      </div>

    </nav>
  `;
}

// ------------------------------------------------------------
// PIE DE PÁGINA
// ------------------------------------------------------------

function construirPie() {
  $("site-footer").innerHTML = `
    <div class="site-footer">

      <h2>Las Recetas de Gia Gia</h2>

      <p>Sabores, historias y tradiciones de Grecia.</p>

      <p class="footer-motto">
        El sabor debe ser auténtico.
      </p>

      <div class="footer-links">
        <a href="index.html">Inicio</a>
        <a href="recetario.html">Recetario</a>
        <a href="seccion.html?tipo=publicaciones">Publicaciones</a>
        <a href="seccion.html?tipo=eventos">Eventos</a>
        <a href="seccion.html?tipo=reconocimientos">Reconocimientos</a>
        <a href="seccion.html?tipo=bebidas">Bebidas</a>
      </div>

      <p>© ${new Date().getFullYear()} Las Recetas de Gia Gia</p>

    </div>
  `;
}

// ------------------------------------------------------------
// FOTOGRAFÍAS
// ------------------------------------------------------------

function fotoHTML(url, nombre, clase = "") {
  if (!url) {
    return `
      <div class="${clase} photo-placeholder" role="img"
        aria-label="Fotografía pendiente de ${escapar(nombre)}">
        Gia Gia
      </div>
    `;
  }

  return `
    <div class="${clase}">
      <img
        src="${escapar(url)}"
        alt="${escapar(nombre)}"
        loading="lazy"
        onerror="this.parentElement.innerHTML='<span class=&quot;photo-placeholder&quot;>Gia Gia</span>'">
    </div>
  `;
}

// ------------------------------------------------------------
// TARJETAS DE RECETAS
// ------------------------------------------------------------

function recetaCard(r) {
  return `
    <article class="recipe-card">

      <a href="receta.html?id=${encodeURIComponent(r.id)}">

        ${fotoHTML(r.imagen, r.nombre, "recipe-photo")}

        <div class="recipe-card-body">

          <span class="recipe-status">
            ${escapar(r.categoria || "")}
          </span>

<h3>${escapar(r.nombre)}</h3>

${valoracionEditorialHTML(r, "card")}

${r.nombreGriego ? `
  <p class="recipe-greek-name">
    ${escapar(r.nombreGriego)}
  </p>
` : ""}

${r.pronunciacionGriega ? `
  <p class="recipe-pronunciation">
    Se pronuncia: ${escapar(r.pronunciacionGriega)}
  </p>
` : ""}

<p>${escapar(r.descripcion || "")}</p>

          <div class="recipe-meta">
            <span>${escapar(r.tiempoTotal || "")}</span>
            <span>${escapar(r.porciones || "")} porciones</span>
          </div>

          <span class="text-link">
            Consultar receta →
          </span>

        </div>

      </a>

    </article>
  `;
}

// ------------------------------------------------------------
// PÁGINA DE INICIO
// ------------------------------------------------------------


function mostrarInicio() {

  // ----------------------------------------------------------
  // RECETAS PUBLICADAS AGRUPADAS POR CATEGORÍA
  // ----------------------------------------------------------

  
const categoriasInicio = [
  {
    nombre: "Entradas",
    aliases: ["entrada", "entradas"]
  },
  {
    nombre: "Ensaladas",
    aliases: ["ensalada", "ensaladas"]
  },
  {
    nombre: "Sopas",
    aliases: ["sopa", "sopas"]
  },
  {
    nombre: "Platos fuertes",
    aliases: ["plato fuerte", "platos fuertes"]
  },
  {
    nombre: "Postres",
    aliases: ["postre", "postres"]
  },
  {
    nombre: "Aderezos",
    aliases: ["aderezo", "aderezos"]
  }
];

  function normalizarCategoria(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const recetas = recetasPublicadas();
  const contenedorCategorias = $("home-category-recipes");

  contenedorCategorias.innerHTML = categoriasInicio.map(categoria => {

    const recetasCategoria = recetas.filter(receta => {

      const id = normalizarCategoria(receta.categoriaId);
      const nombre = normalizarCategoria(receta.categoria);

      return categoria.aliases.includes(id) ||
             categoria.aliases.includes(nombre);

    });

    // No mostrar categorías que todavía no tengan
    // recetas publicadas.

    if (recetasCategoria.length === 0) {
      return "";
    }

    return `
      <section class="featured category-group">

        <div class="section-heading">
          <div>
            <span class="eyebrow">NUESTRA COCINA</span>
            <h3>${categoria.nombre}</h3>
          </div>
        </div>

        <div class="recipe-grid">
          ${recetasCategoria.map(recetaCard).join("")}
        </div>

      </section>
    `;

  }).join("");


  // ----------------------------------------------------------
  // SECCIONES EDITORIALES DE LA PORTADA
  // ----------------------------------------------------------

  const secciones = [
    ["◉", "Conoce a Gia Gia", "La historia detrás de nuestra cocina.", "gia-gia"],
    ["▤", "Publicaciones", "Artículos, entrevistas y documentos.", "publicaciones"],
    ["◇", "Reconocimientos", "Premios y distinciones.", "reconocimientos"],
    ["⌂", "Eventos", "Participaciones y encuentros gastronómicos.", "eventos"],
    ["✧", "Sabores de Grecia", "Historia, ingredientes y tradiciones.", "sabores"],
    ["◌", "Bebidas", "Acompañamientos para nuestra mesa.", "bebidas"]
  ];

  $("home-sections").innerHTML = secciones.map(s => `
    <a class="editorial-card" href="seccion.html?tipo=${s[3]}">

      <span class="editorial-icon">${s[0]}</span>

      <h3>${s[1]}</h3>

      <p>${s[2]}</p>

      <span class="text-link">Descubrir →</span>

    </a>
  `).join("");
}

// ------------------------------------------------------------
// CATÁLOGO DE RECETAS
// ------------------------------------------------------------

function mostrarRecetario() {

  const buscar = $("recipe-search");
  const categoria = $("recipe-category");
  const lista = $("recipe-list");
  const contador = $("recipe-count");

  // Categorías y sus posibles identificadores
 
const categoriasRecetario = [
  {
    nombre: "Entradas",
    aliases: ["entrada", "entradas"]
  },
  {
    nombre: "Ensaladas",
    aliases: ["ensalada", "ensaladas"]
  },
  {
    nombre: "Sopas",
    aliases: ["sopa", "sopas"]
  },
  {
    nombre: "Platos fuertes",
    aliases: ["plato fuerte", "platos fuertes"]
  },
  {
    nombre: "Postres",
    aliases: ["postre", "postres"]
  },
  {
    nombre: "Aderezos",
    aliases: ["aderezo", "aderezos"]
  }
];

  // Normalizar nombres e identificadores
  function normalizarCategoria(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Comprobar si una receta pertenece a una categoría
  function perteneceCategoria(receta, categoriaActual) {

    const id = normalizarCategoria(receta.categoriaId);
    const nombre = normalizarCategoria(receta.categoria);

    return categoriaActual.aliases.includes(id) ||
           categoriaActual.aliases.includes(nombre);
  }

  function filtrar() {

    const texto = buscar.value.toLowerCase().trim();
    const cat = normalizarCategoria(categoria.value);

    // Primero se aplican los filtros de búsqueda
    const resultados = recetasPublicadas().filter(receta => {

      const ingredientes = (receta.ingredientes || [])
        .map(i => i.nombre || "")
        .join(" ");

      const textoReceta = [
  receta.nombre,
  receta.nombreGriego,
  receta.pronunciacionGriega,
  receta.descripcion,
  ingredientes
].join(" ").toLowerCase();

      const coincideTexto = textoReceta.includes(texto);

      const coincideCategoria =
        cat === "todos" ||
        categoriasRecetario.some(c =>
          c.aliases.includes(cat) &&
          perteneceCategoria(receta, c)
        );

      return coincideTexto && coincideCategoria;
    });

    // Actualizar contador
    contador.textContent =
      `${resultados.length} receta(s) encontrada(s).`;

    // Construir una sección independiente por categoría
    const gruposHTML = categoriasRecetario.map(categoriaActual => {

      const recetasCategoria = resultados.filter(receta =>
        perteneceCategoria(receta, categoriaActual)
      );

      // Ocultar categorías sin resultados
      if (recetasCategoria.length === 0) {
        return "";
      }

      return `
        <section class="category-group">

          <div class="section-heading">
            <div>
              <span class="eyebrow">NUESTRA COCINA</span>
              <h2>${categoriaActual.nombre}</h2>
            </div>
          </div>

          <div class="recipe-grid">
            ${recetasCategoria.map(recetaCard).join("")}
          </div>

        </section>
      `;

    }).join("");

    lista.innerHTML = gruposHTML || `
      <div class="empty-state">
        No encontramos recetas publicadas con esos criterios.
      </div>
    `;
  }

  buscar.addEventListener("input", filtrar);
  categoria.addEventListener("change", filtrar);

  filtrar();
}

// ------------------------------------------------------------
// PÁGINA INDIVIDUAL DE RECETA
// ------------------------------------------------------------

function mostrarReceta() {

  const id = new URLSearchParams(location.search).get("id");

  const r = recetasPublicadas().find(item => item.id === id);

  const main = $("recipe-detail");

  if (!r) {

    main.innerHTML = `
      <div class="section-wrap empty-state">
        <h2>Receta no disponible</h2>
        <p>
          Esta receta todavía no está publicada o no existe.
        </p>
        <a href="recetario.html" class="text-link">
          ← Volver al recetario
        </a>
      </div>
    `;

    return;
  }

  document.title = `${r.nombre} | Las Recetas de Gia Gia`;

  const historia = r.historia || {};

  const ingredientes = r.ingredientes || [];
  const preparacion = r.preparacion || [];

  const bebidas = (r.bebidas || [])
    .map(idBebida => contenido.bebidas.find(b => b.id === idBebida))
    .filter(Boolean);

  const fuente = r.fuente || {};

  main.innerHTML = `

  
    <!-- VISTA NORMAL DE LA RECETA -->

    <section class="recipe-hero">

      ${fotoHTML(r.imagen, r.nombre, "recipe-hero-photo")}

      <div class="recipe-hero-content">

<span class="eyebrow">
  ${escapar(r.categoria || "")}
</span>

<h1>${escapar(r.nombre)}</h1>

${r.nombreGriego ? `
  <p class="recipe-greek-name">
    ${escapar(r.nombreGriego)}
  </p>
` : ""}

${r.pronunciacionGriega ? `
  <p class="recipe-pronunciation">
    Se pronuncia: ${escapar(r.pronunciacionGriega)}
  </p>
` : ""}

<p>${escapar(r.descripcion || "")}</p>
        <div class="recipe-meta">
          <span>◷ ${escapar(r.tiempoPreparacion || "")} preparación</span>
          <span>◷ ${escapar(r.tiempoCoccion || "")} cocción</span>
          <span>♧ ${escapar(r.porciones || "")} porciones</span>
        </div>

        <button
          class="btn btn-primary"
          onclick="window.print()">
          Imprimir receta
        </button>

      </div>

    </section>

    <section class="section-wrap">

      <a href="recetario.html" class="text-link">
        ← Volver al recetario
      </a>

      <div class="story-box">

        <span class="eyebrow">UN POCO DE HISTORIA</span>

        <h2>${escapar(historia.titulo || "")}</h2>

        <p>${escapar(historia.texto || "")}</p>

      </div>

      <div class="recipe-columns">

        <aside class="recipe-panel">

          <h2>Ingredientes</h2>

          <p>Para ${escapar(r.porciones || "")} porciones</p>

          <ul class="ingredient-list">

            ${ingredientes.map(i => `
              <li>
                <strong>${escapar(i.cantidad || "")}</strong>
                ${escapar(i.unidad || "")}
                ${escapar(i.nombre || "")}
              </li>
            `).join("")}

          </ul>

        </aside>

        <section class="recipe-method">

          <h2>Preparación</h2>

          <ol class="method-list">

            ${preparacion.map(p => `
              <li>${escapar(p)}</li>
            `).join("")}

          </ol>

        </section>

      </div>

      ${r.consejo ? `
        <div class="tip-box">

          <span class="eyebrow">EL TOQUE DE GIA GIA</span>

          <h3>Un consejo para recordar</h3>

          <p>${escapar(r.consejo)}</p>

          ${r.consejoValidado
            ? '<p>Consejo validado por Gia Gia.</p>'
            : '<p>Consejo pendiente de revisión familiar.</p>'
          }

        </div>
      ` : ""}

      <section class="section-wrap">

        <span class="eyebrow">PARA ACOMPAÑAR</span>

        <h2>¿Con qué lo servimos?</h2>

        <p>${escapar(r.acompanamiento || "")}</p>

        <div class="drink-grid">

          ${bebidas.map(b => `
            <article class="drink-card">

              <h3>${escapar(b.nombre)}</h3>

              <a
                class="text-link"
                href="seccion.html?tipo=bebidas#bebida-${encodeURIComponent(b.id)}">
                Conocer esta bebida →
              </a>

            </article>
          `).join("")}

        </div>

        <p>
          <a href="seccion.html?tipo=bebidas" class="text-link">
            Consultar catálogo completo de bebidas →
          </a>
        </p>

      </section>

      <div class="story-box">

        <strong>El sabor debe ser auténtico.</strong>

        ${r.estado ? `
          <p>${escapar(r.estado)}</p>
        ` : ""}

        ${fuente.url ? `
          <p>
            Fuente de consulta:
            <a
              href="${escapar(fuente.url)}"
              target="_blank"
              rel="noopener noreferrer">
              ${escapar(fuente.nombre || "Consultar fuente")}
            </a>
          </p>
        ` : ""}

      </div>

    </section>
  `;
}

// ------------------------------------------------------------
// SECCIONES DEL SITIO
// ------------------------------------------------------------

const secciones = {

  "gia-gia": {
    titulo: "Conoce a Gia Gia",
    subtitulo: "La historia detrás de nuestra cocina",
    descripcion: "Una historia familiar que merece conservarse y compartirse.",
    contenido: "Aquí compartiremos la biografía de Gia Gia, sus raíces, sus recuerdos, su relación con Grecia y las historias que han acompañado su cocina.",
    pendientes: [
      "Fotografía principal",
      "Biografía familiar",
      "Recuerdos y anécdotas",
      "Trayectoria culinaria"
    ]
  },

  "publicaciones": {
    titulo: "Publicaciones",
    subtitulo: "Nuestra historia también se cuenta en papel",
    descripcion: "Artículos, entrevistas, reportajes y documentos.",
    tipo: "publicaciones"
  },

  "eventos": {
    titulo: "Eventos y participaciones",
    subtitulo: "La cocina griega también se comparte",
    descripcion: "Encuentros, festivales y experiencias gastronómicas.",
    tipo: "eventos"
  },

  "reconocimientos": {
    titulo: "Reconocimientos",
    subtitulo: "Un camino de dedicación y tradición",
    descripcion: "Premios, homenajes y distinciones.",
    tipo: "reconocimientos"
  },

  "bebidas": {
    titulo: "Bebidas de Grecia",
    subtitulo: "El complemento perfecto para nuestra mesa",
    descripcion: "Una selección de bebidas tradicionales y acompañamientos.",
    tipo: "bebidas"
  },

  "sabores": {
    titulo: "Sabores de Grecia",
    subtitulo: "Historia, ingredientes y tradiciones",
    descripcion: "Un recorrido por la cultura gastronómica griega.",
    contenido: "Grecia reúne tradiciones culinarias regionales, ingredientes mediterráneos y preparaciones transmitidas de generación en generación. Aquí iremos incorporando historias de sus platillos, ingredientes, quesos, hierbas, aceites y costumbres."
  }

};

// ------------------------------------------------------------
// PÁGINA DE SECCIONES
// ------------------------------------------------------------

function mostrarSeccion() {

  const tipo =
    new URLSearchParams(location.search).get("tipo") || "gia-gia";

  const s = secciones[tipo];

  const main = $("section-content");

  if (!s) {
    main.innerHTML = `
      <div class="section-wrap empty-state">
        Sección no disponible.
      </div>
    `;
    return;
  }

  document.title = `${s.titulo} | Las Recetas de Gia Gia`;

  let contenidoHTML = "";

  // ----------------------------------------------------------
  // CATÁLOGO DE BEBIDAS
  // ----------------------------------------------------------

  if (tipo === "bebidas") {

    contenidoHTML = `
      <div class="drink-grid">

        ${contenido.bebidas.map(b => `
          <article
            class="drink-card"
            id="bebida-${escapar(b.id)}">

            <span class="eyebrow">
              ${escapar(b.tipo || "")}
            </span>

            <h3>${escapar(b.nombre)}</h3>

            <p>${escapar(b.descripcion || "")}</p>

            ${b.ideal ? `
              <p>
                <strong>Ideal para:</strong>
                ${escapar(b.ideal)}
              </p>
            ` : ""}

          </article>
        `).join("")}

      </div>
    `;

  // ----------------------------------------------------------
  // PUBLICACIONES, EVENTOS Y RECONOCIMIENTOS
  // ----------------------------------------------------------

  } else if (s.tipo) {

    const lista = contenido[s.tipo] || [];

    contenidoHTML = lista.length
      ? lista.map(item => `
          <article class="section-card">

            <span class="eyebrow">
              ${escapar(item.categoria || "ARCHIVO GIA GIA")}
            </span>

            <h2>${escapar(item.titulo || item.nombre || "")}</h2>

            <p>${escapar(item.descripcion || "")}</p>

            <p>
              ${escapar(item.fecha || "")}
              ${item.lugar ? " · " + escapar(item.lugar) : ""}
            </p>

            ${item.archivo ? `
              <p>
                <a
                  href="${escapar(item.archivo)}"
                  target="_blank"
                  rel="noopener noreferrer">
                  Consultar documento PDF ↗
                </a>
              </p>
            ` : ""}

            ${item.enlace ? `
              <p>
                <a
                  href="${escapar(item.enlace)}"
                  target="_blank"
                  rel="noopener noreferrer">
                  Ver publicación original ↗
                </a>
              </p>
            ` : ""}

          </article>
        `).join("")
      : `
        <div class="empty-state">
          <h3>Estamos construyendo nuestro archivo</h3>
          <p>
            Próximamente compartiremos aquí nuevas historias,
            documentos y recuerdos de Gia Gia.
          </p>
        </div>
      `;

  // ----------------------------------------------------------
  // SECCIONES EDITORIALES
  // ----------------------------------------------------------

  } else {

    contenidoHTML = `
      <div class="story-box">
        <p>${escapar(s.contenido)}</p>
      </div>

      <div class="editorial-grid">

        ${s.pendientes.map(p => `
          <div class="editorial-card">
            <h3>${escapar(p)}</h3>
            <p>Contenido pendiente de incorporar.</p>
          </div>
        `).join("")}

      </div>
    `;
  }

  main.innerHTML = `

    <section class="page-banner">

      <span class="eyebrow">
        ${escapar(s.subtitulo)}
      </span>

      <h1>${escapar(s.titulo)}</h1>

      <p>${escapar(s.descripcion)}</p>

    </section>

    <section class="section-wrap">
      ${contenidoHTML}
    </section>

  `;
}

// ------------------------------------------------------------
// INICIO
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  if (document.body.dataset.page !== "admin") {
    cargarContenido();
  }

});
