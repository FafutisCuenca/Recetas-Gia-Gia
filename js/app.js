
const DATA_URL = "data/contenido.json";

let contenido = null;

const $ = (id) => document.getElementById(id);

async function cargarContenido() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("No fue posible cargar contenido.json");
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

function iniciarPagina() {
  construirNavegacion();
  construirPie();

  const pagina = document.body.dataset.page;

  if (pagina === "inicio") mostrarInicio();
  if (pagina === "recetario") mostrarRecetario();
  if (pagina === "receta") mostrarReceta();
  if (pagina === "seccion") mostrarSeccion();
}

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

function construirPie() {
  $("site-footer").innerHTML = `
    <div class="site-footer">
      <h2>Las Recetas de Gia Gia</h2>
      <p>Sabores, historias y tradiciones de Grecia.</p>
      <p class="footer-motto">El sabor debe ser auténtico.</p>
      <div class="footer-links">
        <a href="index.html">Inicio</a>
        <a href="recetario.html">Recetario</a>
        <a href="seccion.html?tipo=publicaciones">Publicaciones</a>
        <a href="seccion.html?tipo=eventos">Eventos</a>
        <a href="seccion.html?tipo=reconocimientos">Reconocimientos</a>
      </div>
      <p>© ${new Date().getFullYear()} Las Recetas de Gia Gia</p>
    </div>
  `;
}

function fotoHTML(url, nombre, clase = "") {
  if (!url) {
    return `<div class="${clase} photo-placeholder" role="img"
      aria-label="Fotografía pendiente de ${nombre}">Gia Gia</div>`;
  }

  return `<div class="${clase}">
    <img src="${url}" alt="${nombre}" loading="lazy"
      onerror="this.parentElement.innerHTML='<span class=&quot;photo-placeholder&quot;>Gia Gia</span>'">
  </div>`;
}

function recetaCard(r) {
  return `
    <article class="recipe-card">
      <a href="receta.html?id=${encodeURIComponent(r.id)}">
        ${fotoHTML(r.imagen, r.nombre, "recipe-photo")}
        <div class="recipe-card-body">
          <span class="recipe-status">${r.estado}</span>
          <h3>${r.nombre}</h3>
          <p>${r.descripcion}</p>
          <div class="recipe-meta">
            <span>${r.categoria}</span>
            <span>${r.tiempoTotal}</span>
            <span>${r.porciones} porciones</span>
          </div>
          <span class="text-link">Consultar receta →</span>
        </div>
      </a>
    </article>
  `;
}

function mostrarInicio() {
  const destacadas = contenido.recetas.filter(r => r.destacada);
  $("featured-recipes").innerHTML = destacadas.map(recetaCard).join("");

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

function mostrarRecetario() {
  const buscar = $("recipe-search");
  const categoria = $("recipe-category");

  function filtrar() {
    const texto = buscar.value.toLowerCase().trim();
    const cat = categoria.value;

    const resultados = contenido.recetas.filter(r => {
      const coincideTexto = [
        r.nombre, r.nombreGriego, r.descripcion,
        ...(r.ingredientes || []).map(i => i.nombre)
      ].join(" ").toLowerCase().includes(texto);

      const coincideCategoria = cat === "todos" || r.categoriaId === cat;
      return coincideTexto && coincideCategoria;
    });

    $("recipe-count").textContent = `${resultados.length} receta(s) encontrada(s).`;

    $("recipe-list").innerHTML = resultados.length
      ? resultados.map(recetaCard).join("")
      : '<div class="empty-state">No encontramos recetas con esos criterios.</div>';
  }

  buscar.addEventListener("input", filtrar);
  categoria.addEventListener("change", filtrar);
  filtrar();
}

function mostrarReceta() {
  const id = new URLSearchParams(location.search).get("id");
  const r = contenido.recetas.find(item => item.id === id);
  const main = $("recipe-detail");

  if (!r) {
    main.innerHTML = '<div class="section-wrap empty-state">No encontramos esta receta.</div>';
    return;
  }

  document.title = `${r.nombre} | Las Recetas de Gia Gia`;

  main.innerHTML = `
    <section class="recipe-hero">
      ${fotoHTML(r.imagen, r.nombre, "recipe-hero-photo")}
      <div class="recipe-hero-content">
        <span class="eyebrow">${r.nombreGriego} · ${r.categoria}</span>
        <h1>${r.nombre}</h1>
        <p>${r.descripcion}</p>
        <div class="recipe-meta">
          <span>◷ ${r.tiempoPreparacion} preparación</span>
          <span>◷ ${r.tiempoCoccion} cocción</span>
          <span>♧ ${r.porciones} porciones</span>
        </div>
        <p><span class="recipe-status">${r.estado}</span></p>
        <button class="btn btn-primary" onclick="window.print()">Imprimir receta</button>
      </div>
    </section>

    <section class="section-wrap">
      <a href="recetario.html" class="text-link">← Volver al recetario</a>

      <div class="story-box">
        <span class="eyebrow">UN POCO DE HISTORIA</span>
        <h2>${r.historia.titulo}</h2>
        <p>${r.historia.texto}</p>
      </div>

      <div class="recipe-columns">
        <aside class="recipe-panel">
          <h2>Ingredientes</h2>
          <p>Para ${r.porciones} porciones</p>
          <ul class="ingredient-list">
            ${r.ingredientes.map(i => `
              <li><strong>${i.cantidad}</strong> ${i.nombre}</li>
            `).join("")}
          </ul>
        </aside>

        <section class="recipe-method">
          <h2>Preparación</h2>
          <ol class="method-list">
            ${r.preparacion.map(p => `<li>${p}</li>`).join("")}
          </ol>
        </section>
      </div>

      <div class="tip-box">
        <span class="eyebrow">EL TOQUE DE GIA GIA</span>
        <h3>Un consejo para recordar</h3>
        <p>${r.consejo}</p>
        <p><strong>Estado del consejo:</strong> ${r.consejoValidado ? "Validado por Gia Gia" : "Pendiente de revisión familiar"}</p>
      </div>

      <section class="section-wrap">
        <span class="eyebrow">PARA ACOMPAÑAR</span>
        <h2>¿Con qué lo servimos?</h2>
        <p>${r.acompanamiento}</p>
        <div class="drink-grid">
          ${(r.bebidas || []).map(nombre => {
            const bebida = contenido.bebidas.find(b => b.id === nombre);
            return bebida ? `
              <article class="drink-card">
                <h3>${bebida.nombre}</h3>
                <p>${bebida.descripcion}</p>
              </article>` : "";
          }).join("")}
        </div>
      </section>

      <div class="story-box">
        <strong>El sabor debe ser auténtico.</strong>
        <p>Receta de referencia. Esta preparación está pendiente de validación por Gia Gia.</p>
        <p>Fuente de consulta: <a href="${r.fuente.url}" target="_blank" rel="noopener">${r.fuente.nombre}</a></p>
      </div>
    </section>
  `;
}

const secciones = {
  "gia-gia": {
    titulo: "Conoce a Gia Gia",
    subtitulo: "La historia detrás de nuestra cocina",
    descripcion: "Una historia familiar que merece conservarse y compartirse.",
    contenido: "Aquí compartiremos la biografía de Gia Gia, sus raíces, sus recuerdos, su relación con Grecia y las historias que han acompañado su cocina.",
    pendientes: ["Fotografía principal", "Biografía familiar", "Recuerdos y anécdotas", "Trayectoria culinaria"]
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

function mostrarSeccion() {
  const tipo = new URLSearchParams(location.search).get("tipo") || "gia-gia";
  const s = secciones[tipo];
  const main = $("section-content");

  if (!s) {
    main.innerHTML = '<div class="section-wrap empty-state">Sección no disponible.</div>';
    return;
  }

  document.title = `${s.titulo} | Las Recetas de Gia Gia`;

  let contenidoHTML = "";

  if (tipo === "bebidas") {
    contenidoHTML = `<div class="drink-grid">
      ${contenido.bebidas.map(b => `
        <article class="drink-card">
          <span class="eyebrow">${b.tipo}</span>
          <h3>${b.nombre}</h3>
          <p>${b.descripcion}</p>
          <p><strong>Ideal para:</strong> ${b.ideal}</p>
        </article>
      `).join("")}
    </div>`;
  } else if (s.tipo) {
    const lista = contenido[s.tipo] || [];

    contenidoHTML = lista.length ? lista.map(item => `
      <article class="section-card">
        <span class="eyebrow">${item.categoria || "ARCHIVO GIA GIA"}</span>
        <h2>${item.titulo || item.nombre}</h2>
        <p>${item.descripcion}</p>
        <p>${item.fecha || ""} ${item.lugar ? " · " + item.lugar : ""}</p>
        ${item.archivo ? `<p><a href="${item.archivo}" target="_blank">Consultar documento PDF ↗</a></p>` : ""}
        ${item.enlace ? `<p><a href="${item.enlace}" target="_blank" rel="noopener">Ver publicación original ↗</a></p>` : ""}
      </article>
    `).join("") : `
      <div class="empty-state">
        <h3>Estamos construyendo nuestro archivo</h3>
        <p>Próximamente compartiremos aquí nuevas historias, documentos y recuerdos de Gia Gia.</p>
      </div>`;
  } else {
    contenidoHTML = `
      <div class="story-box"><p>${s.contenido}</p></div>
      <div class="editorial-grid">
        ${s.pendientes.map(p => `
          <div class="editorial-card">
            <h3>${p}</h3>
            <p>Contenido pendiente de incorporar.</p>
          </div>
        `).join("")}
      </div>`;
  }

  main.innerHTML = `
    <section class="page-banner">
      <span class="eyebrow">${s.subtitulo}</span>
      <h1>${s.titulo}</h1>
      <p>${s.descripcion}</p>
    </section>
    <section class="section-wrap">${contenidoHTML}</section>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page !== "admin") cargarContenido();
});
