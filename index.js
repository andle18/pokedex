//   ESTADO

let acumulador = 1; // ID del Pokémon actual
let pokemonActual = null; // Datos del Pokémon en pantalla
let modoInfo = "tipos"; // 'tipos' o 'movimientos' (lo cambia START/SELECT)

//   REFERENCIAS AL DOM

const imgPokemon = document.getElementById("imagenDelPokemon");
const nombreEl = document.getElementById("nombrePokemon");
const numeroEl = document.getElementById("numeroPokemon");
const infoTitulo = document.getElementById("infoTitulo");
const infoContenido = document.getElementById("infoContenido");
const indicador = document.getElementById("indicadorDeCarga");
const infoContainer = document.getElementById("informacion");
const input = document.getElementById("campoDeBusqueda");

//   UTILIDADES

function pressEffect(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("pressed");
  setTimeout(() => el.classList.remove("pressed"), 150);
}

function limpiarPantalla() {
  nombreEl.textContent = "?";
  numeroEl.textContent = "#000";
  imgPokemon.src = "";
  infoContenido.textContent = "- / -";
  pokemonActual = null;
  input.value = "";
  infoContainer.innerHTML = "";
  mostrarBienvenida(); // ← muestra el logo de nuevo
}

function actualizarInfoPantalla() {
  if (!pokemonActual) return;

  if (modoInfo === "tipos") {
    infoTitulo.textContent = "TIPOS";
    const tipos = pokemonActual.types.map((t) => t.type.name);
    infoContenido.textContent = tipos.join(" / ");
  } else {
    infoTitulo.textContent = "MOVIMIENTOS";
    const movs = pokemonActual.moves.slice(0, 3).map((m) => m.move.name);
    infoContenido.textContent = movs.length ? movs.join(", ") : "-";
  }
}

//   LLAMADA A LA POKE API

async function llamarServidor(url) {
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error("Pokémon no encontrado");

    const data = await respuesta.json();
    pokemonActual = data;
    acumulador = data.id; // sincroniza el acumulador con el ID real

    mostrarPokemon();
    imgPokemon.src = data.sprites.front_default || "";
    nombreEl.textContent = data.name;
    numeroEl.textContent = "#" + String(data.id).padStart(3, "0");

    actualizarInfoPantalla();
    infoContainer.innerHTML = "";
  } catch (error) {
    console.error(error);
    nombreEl.textContent = "ERROR";
    numeroEl.textContent = "no existe";
    imgPokemon.src = "";
    infoContenido.textContent = "- / -";
    infoContainer.innerHTML =
      "¡Ese Pokémon no existe! Revisa el nombre e inténtalo de nuevo.";
  } finally {
  }
}

//   BÚSQUEDA POR INPUT

function buscarPokemones() {
  const nombre = input.value.toLowerCase().trim();
  if (nombre) {
    infoContainer.innerHTML = "";
    llamarServidor(`https://pokeapi.co/api/v2/pokemon/${nombre}`);
  }
}

//   BOTONES DE LA GAME BOY

// D-PAD: NAVEGACIÓN
document.getElementById("btnRight").addEventListener("click", () => {
  pressEffect("btnRight");
  acumulador++;
  llamarServidor(`https://pokeapi.co/api/v2/pokemon/${acumulador}`);
});

document.getElementById("btnLeft").addEventListener("click", () => {
  pressEffect("btnLeft");
  if (acumulador > 1) acumulador--;
  llamarServidor(`https://pokeapi.co/api/v2/pokemon/${acumulador}`);
});

document.getElementById("btnUp").addEventListener("click", () => {
  pressEffect("btnUp");
  acumulador = Math.min(acumulador + 10, 1025);
  llamarServidor(`https://pokeapi.co/api/v2/pokemon/${acumulador}`);
});

document.getElementById("btnDown").addEventListener("click", () => {
  pressEffect("btnDown");
  acumulador = Math.max(acumulador - 10, 1);
  llamarServidor(`https://pokeapi.co/api/v2/pokemon/${acumulador}`);
});

// BOTÓN A → mostrar evoluciones del Pokémon actual
document.getElementById("btnA").addEventListener("click", () => {
  pressEffect("btnA");
  cargarEvoluciones();
});

// BOTÓN B → si estás en evoluciones vuelve al Pokémon; si no, limpia todo
document.getElementById("btnB").addEventListener("click", () => {
  pressEffect("btnB");
  if (pantallaEvoluciones.style.display !== "none") {
    mostrarPokemon();
  } else {
    limpiarPantalla();
  }
});

// START → busca por nombre si hay texto; si no: carga #1 o muestra movimientos
document.getElementById("btnStart").addEventListener("click", () => {
  pressEffect("btnStart");
  const nombre = input.value.toLowerCase().trim();
  if (nombre) {
    infoContainer.innerHTML = "";
    llamarServidor(`https://pokeapi.co/api/v2/pokemon/${nombre}`);
    return;
  }
  if (!pokemonActual) {
    llamarServidor(`https://pokeapi.co/api/v2/pokemon/${acumulador}`);
    return;
  }
  modoInfo = "movimientos";
  actualizarInfoPantalla();
});

// SELECT → modo tipos
document.getElementById("btnSelect").addEventListener("click", () => {
  modoInfo = "tipos";
  actualizarInfoPantalla();
});

//   PANTALLAS: bienvenida / pokemon / evoluciones

const pantallaBienvenida = document.getElementById("pantallaBienvenida");
const pantallaPokemon = document.getElementById("pantallaPokemon");
const pantallaEvoluciones = document.getElementById("pantallaEvoluciones");

function mostrarBienvenida() {
  pantallaBienvenida.style.display = "flex";
  pantallaPokemon.style.display = "none";
  pantallaEvoluciones.style.display = "none";
}

function mostrarPokemon() {
  pantallaBienvenida.style.display = "none";
  pantallaPokemon.style.display = "flex";
  pantallaEvoluciones.style.display = "none";
}

function mostrarEvoluciones() {
  pantallaBienvenida.style.display = "none";
  pantallaPokemon.style.display = "none";
  pantallaEvoluciones.style.display = "flex";
}

//   EVOLUCIONES

function aplanarCadena(chain, resultado = []) {
  resultado.push(chain.species.name);
  if (chain.evolves_to.length > 0) {
    aplanarCadena(chain.evolves_to[0], resultado);
  }
  return resultado;
}

async function cargarEvoluciones() {
  if (!pokemonActual) return;

  try {
    const speciesRes = await fetch(pokemonActual.species.url);
    const species = await speciesRes.json();

    const chainRes = await fetch(species.evolution_chain.url);
    const chainData = await chainRes.json();

    const nombres = aplanarCadena(chainData.chain);
    if (nombres.length <= 1) return; // no evoluciona, no hace nada

    const pokemones = await Promise.all(
      nombres.map((n) =>
        fetch(`https://pokeapi.co/api/v2/pokemon/${n}`).then((r) => r.json()),
      ),
    );

    const size = nombres.length === 2 ? 72 : 54;
    const evoLista = document.getElementById("evoLista");
    evoLista.innerHTML = pokemones
      .map(
        (p, i) =>
          (i > 0 ? '<div class="evo-flecha">▶</div>' : "") +
          `<div class="evo-item">
            <img src="${p.sprites.front_default}" width="${size}" height="${size}" alt="${p.name}">
            <span>${p.name}</span>
          </div>`,
      )
      .join("");

    mostrarEvoluciones();
  } catch (e) {
    console.error(e);
  }
}
