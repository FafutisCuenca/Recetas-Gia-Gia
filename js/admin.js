
const JSON_URL = "data/contenido.json";

const editor = document.getElementById("json-editor");
const statusBox = document.getElementById("admin-status");

function informar(mensaje, tipo = "") {
  statusBox.textContent = mensaje;
  statusBox.className = `admin-status ${tipo}`;
}

async function cargarJSON() {
  try {
    const respuesta = await fetch(JSON_URL);

    if (!respuesta.ok) throw new Error("No se pudo acceder al JSON.");

    const datos = await respuesta.json();
    editor.value = JSON.stringify(datos, null, 2);

    informar("Contenido publicado cargado correctamente.", "success");
  } catch (error) {
    informar(error.message + " Abre el administrador mediante un servidor local.", "error");
  }
}

function validarJSON() {
  try {
    const datos = JSON.parse(editor.value);

    const secciones = [
      "recetas", "bebidas", "publicaciones",
      "eventos", "reconocimientos"
    ];

    for (const nombre of secciones) {
      if (!Array.isArray(datos[nombre])) {
        throw new Error(`La sección ${nombre} debe ser una lista.`);
      }
    }

    const ids = datos.recetas.map(r => r.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error("Hay identificadores de recetas duplicados.");
    }

    for (const receta of datos.recetas) {
      if (!receta.id || !receta.nombre ||
          !Array.isArray(receta.ingredientes) ||
          !Array.isArray(receta.preparacion)) {
        throw new Error("Una receta tiene campos obligatorios incompletos.");
      }
    }

    informar(
      `Validación correcta: ${datos.recetas.length} recetas, ` +
      `${datos.bebidas.length} bebidas y estructura general válida.`,
      "success"
    );

    return datos;
  } catch (error) {
    informar("Error de validación: " + error.message, "error");
    return null;
  }
}

function importarArchivo(archivo) {
  if (!archivo) return;

  const lector = new FileReader();

  lector.onload = () => {
    try {
      const datos = JSON.parse(lector.result);
      editor.value = JSON.stringify(datos, null, 2);
      informar("Archivo importado. Ejecuta la validación antes de exportarlo.", "success");
    } catch {
      informar("El archivo seleccionado no contiene JSON válido.", "error");
    }
  };

  lector.readAsText(archivo);
}

function exportarJSON() {
  const datos = validarJSON();
  if (!datos) return;

  const archivo = new Blob(
    [JSON.stringify(datos, null, 2)],
    { type: "application/json;charset=utf-8" }
  );

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = "contenido.json";
  enlace.click();

  URL.revokeObjectURL(url);

  informar("Archivo contenido.json preparado para descargar.", "success");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("load-json").addEventListener("click", cargarJSON);
  document.getElementById("validate-json").addEventListener("click", validarJSON);
  document.getElementById("download-json").addEventListener("click", exportarJSON);

  document.getElementById("json-file").addEventListener("change", event => {
    importarArchivo(event.target.files[0]);
  });

  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (header) {
    header.innerHTML = `
      <nav class="navbar">
        <a class="brand" href="index.html">
          <span class="brand-symbol">ΓΓ</span>
          <span class="brand-name">Las Recetas de Gia Gia
            <small>ADMINISTRACIÓN</small>
          </span>
        </a>
        <div class="nav-links"><a href="index.html">Volver al sitio</a></div>
      </nav>`;
  }

  if (footer) {
    footer.innerHTML = `
      <div class="site-footer">
        <p class="footer-motto">El sabor debe ser auténtico.</p>
        <p>Centro de administración local.</p>
      </div>`;
  }
});
