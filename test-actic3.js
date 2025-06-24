let dadesJSON;
let estatUsuari = JSON.parse(localStorage.getItem("progresACTIC3")) || {};
let seccioActual = null;
let cuaPreguntes = [];
// Variable global per mantenir la referència al botó de secció actiu
let botoSeccioActiuActual = null;

// Carregar les dades del JSON quan el DOM estigui completament carregat
document.addEventListener('DOMContentLoaded', () => {
    fetch("preguntes-actic3.json")
      .then(r => r.json())
      .then(data => {
        dadesJSON = data;
        mostrarModal();
      })
      .catch(error => {
        console.error("Error carregar preguntes-actic3.json:", error);
        alert("No s'han pogut carregar les preguntes. Si us plau, recarrega la pàgina.");
      });
});


function mostrarModal() {
  const modal = document.getElementById("continuar-modal");
  const continuarBtn = document.getElementById("continuarBtn");
  const reiniciarBtn = document.getElementById("reiniciarBtn");

  // Si hi ha progrés guardat, mostra el modal
  if (Object.keys(estatUsuari).length > 0) {
    modal.classList.remove("hidden");

    continuarBtn.onclick = () => {
      modal.classList.add("hidden");
      // Recuperar la secció actual de l'estat si es continua
      // seccioActual ja es carrega des de localStorage en la definició de estatUsuari
      // Hem de trobar la secció activa en estatUsuari
      const sectionsWithProgress = Object.keys(estatUsuari).filter(key => Object.keys(estatUsuari[key].respostes).length > 0);
      if (sectionsWithProgress.length > 0) {
          // Intentem seleccionar la secció que va tenir l'última resposta
          // Això pot requerir una lògica més complexa si vols la *darrera* secció activa
          // Per simplicitat, si hi ha progrés, agafem la primera secció amb respostes com a activa
          seccioActual = sectionsWithProgress[0];
      }
      carregarSeccions();
    };

    reiniciarBtn.onclick = () => {
      localStorage.removeItem("progresACTIC3");
      estatUsuari = {};
      seccioActual = null; // Reiniciar també la secció actual
      modal.classList.add("hidden");
      carregarSeccions();
    };
  } else {
    // Si no hi ha progrés, carregar les seccions directament
    carregarSeccions();
  }
}

function carregarSeccions() {
  const sectionButtons = document.getElementById("sectionButtons");
  sectionButtons.innerHTML = ""; // Netejar botons existents

  // Bucle per crear cada botó de secció
  Object.keys(dadesJSON).forEach((clau, index) => {
    const boto = document.createElement("button");
    boto.textContent = dadesJSON[clau].titol;
    // Classes base per a tots els botons de secció
    // px-2 és més estret que px-3, ajudarà amb l'alineació
    boto.className = "px-2 py-1 rounded text-white text-sm transition-colors duration-200";

    // Afegir la classe de color base (no seleccionat)
    boto.classList.add("bg-blue-500/50");
    // Afegir la classe de hover
    boto.classList.add("hover:bg-blue-600");

    boto.onclick = () => {
      // Si hi ha un botó seleccionat actualment, desmarcar-lo
      if (botoSeccioActiuActual) {
        botoSeccioActiuActual.classList.remove("bg-blue-700", "shadow-md");
        botoSeccioActiuActual.classList.add("bg-blue-500/50"); // Tornar al color no seleccionat
      }

      // Marcar el botó clicat com a actiu
      boto.classList.remove("bg-blue-500/50"); // Treure el color no seleccionat
      boto.classList.add("bg-blue-700", "shadow-md"); // Afegir color de seleccionat i ombra
      botoSeccioActiuActual = boto; // Actualitzar la referència al botó actiu

      seccioActual = clau;
      // Inicialitzar l'estat de la secció si no existeix
      estatUsuari[clau] = estatUsuari[clau] || { respostes: {}, encerts: 0, dificils: [] };

      // Reomplir la cua de preguntes
      // Si la secció ja està completada, permetem repetir-la carregant totes les preguntes.
      const preguntesCompletades = Object.keys(estatUsuari[clau].respostes).length;
      if (preguntesCompletades === dadesJSON[clau].preguntes.length && dadesJSON[clau].preguntes.length > 0) {
          cuaPreguntes = [...dadesJSON[clau].preguntes]; // Totes les preguntes per repetir
          // Opcional: Si es reinicia una secció, podríem resetear els encerts i les respostes per a aquesta secció
          // estatUsuari[clau].respostes = {};
          // estatUsuari[clau].encerts = 0;
      } else {
          // Preguntes pendents
          cuaPreguntes = dadesJSON[clau].preguntes.filter(p => !estatUsuari[clau].respostes[p.id]);
      }

      document.getElementById("resultat").classList.add("hidden");
      document.getElementById("progress-container").classList.remove("hidden");

      // Actualitzar la barra de progrés en carregar la secció
      const totalPreguntesSeccio = dadesJSON[seccioActual].preguntes.length;
      const respostesFetes = Object.keys(estatUsuari[seccioActual].respostes).length;
      updateProgressBar(respostesFetes, totalPreguntesSeccio);

      mostrarPregunta();
    };
    sectionButtons.appendChild(boto);

    // Lògica per seleccionar el botó correcte al carregar la pàgina
    if (seccioActual === clau) {
      // Si ja tenim una secció activa (per exemple, venim del modal "Continuar")
      boto.click(); // Simulem un clic per activar el botó i la lògica de la secció
    } else if (!seccioActual && index === 0) {
      // Si no hi ha cap secció activa i és el primer botó (primera càrrega sense progrés)
      boto.click(); // Simulem un clic per activar el primer botó
    }
  });

  // Gestió dels botons Exportar/Importar
  document.getElementById("exportarBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(estatUsuari)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "progres-actic3.json";
    link.click();
  };

  document.getElementById("importarInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        estatUsuari = JSON.parse(event.target.result);
        localStorage.setItem("progresACTIC3", JSON.stringify(estatUsuari));
        location.reload(); // Recarregar la pàgina per aplicar el progrés
      } catch (error) {
        alert("Error en importar el fitxer. Assegura't que és un fitxer de progrés vàlid.");
        console.error("Error importació JSON:", error);
      }
    };
    reader.readAsText(file);
  });
}

function mostrarPregunta() {
  const container = document.getElementById("test-container");
  
  const totalPreguntesSeccio = dadesJSON[seccioActual].preguntes.length;
  // Les respostes fetes són les que estan registrades a estatUsuari.respostes
  const respostesFetes = Object.keys(estatUsuari[seccioActual].respostes).length;
  updateProgressBar(respostesFetes, totalPreguntesSeccio);

  // Si no queden preguntes a la cua, mostrar resultats
  if (cuaPreguntes.length === 0) return mostrarResultats();

  const pregunta = cuaPreguntes[0]; // La pregunta actual és la primera de la cua
  const correcta = Array.isArray(pregunta.correcta) ? pregunta.correcta : [pregunta.correcta];

  container.innerHTML = `<div class="p-4 border rounded-xl bg-gray-50">
    <p class="font-medium mb-2">${pregunta.text}</p>
    <div id="opcions" class="space-y-2"></div>
    <p id="feedback" class="text-sm font-medium mt-2"></p>
    <button id="marcaDificil" class="mt-2 text-sm text-blue-600 underline hover:text-blue-800 transition-colors duration-200">Marca com a difícil</button>
    <div class="mt-4">
      <button id="seguentBtn" class="hidden bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200">Següent</button>
    </div>
  </div>`;

  const opcionsDiv = document.getElementById("opcions");
  const tipus = pregunta.tipus === "multiseleccio" ? "checkbox" : "radio";

  pregunta.opcions.forEach((text, i) => {
    const label = document.createElement("label");
    // Afegim classes de transició per a un efecte més suau
    label.className = "block bg-white border px-3 py-2 rounded cursor-pointer hover:bg-blue-50 transition-colors duration-200";
    label.innerHTML = `<input type="${tipus}" name="preg-${pregunta.id}" value="${i}" class="mr-2">${text}`;
    opcionsDiv.appendChild(label);
  });

  const feedback = document.getElementById("feedback");
  const seguentBtn = document.getElementById("seguentBtn"); // Referència al botó Següent

  opcionsDiv.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", () => {
      const seleccionats = Array.from(opcionsDiv.querySelectorAll("input:checked")).map(i => parseInt(i.value));
      const encert = JSON.stringify([...seleccionats].sort()) === JSON.stringify([...correcta].sort());

      // Deshabilitar totes les opcions un cop s'ha respost
      opcionsDiv.querySelectorAll("input").forEach(inp => {
        inp.disabled = true;
      });
      // Treure l'efecte hover i el cursor de les labels de les opcions
      opcionsDiv.querySelectorAll("label").forEach(lbl => {
        lbl.classList.remove("cursor-pointer", "hover:bg-blue-50");
      });

      // Marcar visualment les opcions correctes/incorrectes
      opcionsDiv.querySelectorAll("label").forEach((label, i) => {
        label.classList.remove("bg-white"); // Treure el fons blanc per defecte
        if (correcta.includes(i)) {
          label.classList.add("bg-green-100", "border-green-500");
        }
        if (seleccionats.includes(i) && !correcta.includes(i)) {
          label.classList.add("bg-red-100", "border-red-500");
        }
      });

      mostrarFeedback(encert, correcta, pregunta);
      estatUsuari[seccioActual].respostes[pregunta.id] = seleccionats;

      // Actualitzar encerts només si la resposta és correcta
      if (encert) {
        estatUsuari[seccioActual].encerts = (estatUsuari[seccioActual].encerts || 0) + 1;
        // Si s'encerta una pregunta que estava marcada com a difícil, la treiem de difícils
        const indexDificil = estatUsuari[seccioActual].dificils.indexOf(pregunta.id);
        if (indexDificil !== -1) {
            estatUsuari[seccioActual].dificils.splice(indexDificil, 1);
        }
      }

      localStorage.setItem("progresACTIC3", JSON.stringify(estatUsuari));
      seguentBtn.classList.remove("hidden"); // Mostrar el botó "Següent"
      
      // Actualitzar la barra de progrés un cop s'ha respost
      const respostesActuals = Object.keys(estatUsuari[seccioActual].respostes).length;
      updateProgressBar(respostesActuals, totalPreguntesSeccio);
    });
  });

  document.getElementById("marcaDificil").onclick = () => {
    const dif = estatUsuari[seccioActual].dificils;
    if (!dif.includes(pregunta.id)) {
        dif.push(pregunta.id);
        alert("Pregunta marcada com a difícil.");
    } else {
        alert("Aquesta pregunta ja estava marcada com a difícil.");
    }
    localStorage.setItem("progresACTIC3", JSON.stringify(estatUsuari));
  };

  seguentBtn.onclick = () => {
    cuaPreguntes.shift(); // Eliminar la pregunta actual de la cua
    mostrarPregunta(); // Mostrar la següent pregunta
  };
}

function mostrarFeedback(encert, correcta, pregunta) {
  const feedback = document.getElementById("feedback");
  if (encert) {
    feedback.innerHTML = "<span class='text-green-600'>Molt bé! Has encertat! 😊</span>";
  } else {
    const correcteText = correcta.map(i => pregunta.opcions[i]).join("<br>");
    feedback.innerHTML = `<span class='text-red-600'>Ohhh! Ho sento. La resposta correcta és:<br><span class="text-sm text-gray-800">${correcteText}</span></span>`;
  }
}

function mostrarResultats() {
  const seccio = dadesJSON[seccioActual];
  const preguntes = seccio.preguntes;
  const encerts = estatUsuari[seccioActual].encerts || 0; // Assegurar que encerts és 0 si no hi ha

  document.getElementById("resultatText").textContent = `Has encertat ${encerts} de ${preguntes.length} preguntes.`;
  document.getElementById("resultat").classList.remove("hidden");

  // La barra de progrés hauria d'estar al 100% quan es mostren els resultats
  updateProgressBar(preguntes.length, preguntes.length);
}

function updateProgressBar(respostesFetes, totalPreguntes) {
  if (totalPreguntes === 0) {
    document.getElementById("progress-bar").style.width = `0%`;
    return;
  }
  const percent = (respostesFetes / totalPreguntes) * 100;
  document.getElementById("progress-bar").style.width = `${percent}%`;
}
