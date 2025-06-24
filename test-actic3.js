let dadesJSON;
let estatUsuari = JSON.parse(localStorage.getItem("progresACTIC3")) || {};
let seccioActual = null;
let cuaPreguntes = [];

fetch("preguntes-actic3.json")
  .then(r => r.json())
  .then(data => {
    dadesJSON = data;
    mostrarModal();
  });

function mostrarModal() {
  const modal = document.getElementById("continuar-modal");
  const continuarBtn = document.getElementById("continuarBtn");
  const reiniciarBtn = document.getElementById("reiniciarBtn");

  if (Object.keys(estatUsuari).length > 0) {
    modal.classList.remove("hidden");

    continuarBtn.onclick = () => {
      modal.classList.add("hidden");
      carregarSeccions();
    };

    reiniciarBtn.onclick = () => {
      localStorage.removeItem("progresACTIC3");
      estatUsuari = {};
      modal.classList.add("hidden");
      carregarSeccions();
    };
  } else {
    carregarSeccions();
  }
}

function carregarSeccions() {
  const sectionButtons = document.getElementById("sectionButtons");
  sectionButtons.innerHTML = "";

  Object.keys(dadesJSON).forEach(clau => {
    const boto = document.createElement("button");
    boto.textContent = dadesJSON[clau].titol;
    boto.className = "px-3 py-1 rounded bg-blue-500/50 hover:bg-blue-500 text-white text-sm";
    boto.onclick = () => {
      document.querySelectorAll("#sectionButtons button").forEach(b => b.classList.remove("active-section"));
      boto.classList.add("active-section");

      seccioActual = clau;
      estatUsuari[clau] = estatUsuari[clau] || { respostes: {}, encerts: 0, dificils: [] };
      cuaPreguntes = dadesJSON[clau].preguntes.filter(p => !estatUsuari[clau].respostes[p.id]);

      document.getElementById("resultat").classList.add("hidden");
      document.getElementById("progress-container").classList.remove("hidden");
      mostrarPregunta();
    };
    sectionButtons.appendChild(boto);
  });

  // Botons import/export
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
      estatUsuari = JSON.parse(event.target.result);
      localStorage.setItem("progresACTIC3", JSON.stringify(estatUsuari));
      location.reload();
    };
    reader.readAsText(file);
  });
}

function mostrarPregunta() {
  const container = document.getElementById("test-container");
  if (cuaPreguntes.length === 0) return mostrarResultats();

  const pregunta = cuaPreguntes[0];
  const correcta = Array.isArray(pregunta.correcta) ? pregunta.correcta : [pregunta.correcta];

  container.innerHTML = `<div class="p-4 border rounded-xl bg-gray-50">
    <p class="font-medium mb-2">${pregunta.text}</p>
    <div id="opcions" class="space-y-2"></div>
    <p id="feedback" class="text-sm font-medium mt-2"></p>
    <button id="marcaDificil" class="mt-2 text-sm text-blue-600 underline">Marca com a difícil</button>
    <div class="mt-4">
      <button id="seguentBtn" class="hidden bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Següent</button>
    </div>
  </div>`;

  const opcionsDiv = document.getElementById("opcions");
  const tipus = pregunta.tipus === "multiseleccio" ? "checkbox" : "radio";

  pregunta.opcions.forEach((text, i) => {
    const label = document.createElement("label");
    label.className = "block bg-white border px-3 py-2 rounded cursor-pointer hover:bg-blue-50";
    label.innerHTML = `<input type="${tipus}" name="preg-${pregunta.id}" value="${i}" class="mr-2">${text}`;
    opcionsDiv.appendChild(label);
  });

  const feedback = document.getElementById("feedback");

  opcionsDiv.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", () => {
      const seleccionats = Array.from(opcionsDiv.querySelectorAll("input:checked")).map(i => parseInt(i.value));
      const encert = JSON.stringify([...seleccionats].sort()) === JSON.stringify([...correcta].sort());

      opcionsDiv.querySelectorAll("label").forEach((label, i) => {
        label.classList.remove("bg-green-100", "bg-red-100", "border-green-500", "border-red-500", "cursor-pointer", "hover:bg-blue-50");
        label.querySelector("input").disabled = true;
        if (correcta.includes(i)) label.classList.add("bg-green-100", "border-green-500");
        if (seleccionats.includes(i) && !correcta.includes(i)) label.classList.add("bg-red-100", "border-red-500");
      });

      mostrarFeedback(encert, correcta, pregunta);
      estatUsuari[seccioActual].respostes[pregunta.id] = seleccionats;
      localStorage.setItem("progresACTIC3", JSON.stringify(estatUsuari));
      document.getElementById("seguentBtn").classList.remove("hidden");
    });
  });

  document.getElementById("marcaDificil").onclick = () => {
    const dif = estatUsuari[seccioActual].dificils;
    if (!dif.includes(pregunta.id)) dif.push(pregunta.id);
    localStorage.setItem("progresACTIC3", JSON.stringify(estatUsuari));
    alert("Pregunta marcada com a difícil");
  };

  document.getElementById("seguentBtn").onclick = () => {
    cuaPreguntes.shift();
    mostrarPregunta();
  };
}

function mostrarFeedback(encert, correcta, pregunta) {
  const feedback = document.getElementById("feedback");
  if (encert) {
    estatUsuari[seccioActual].encerts++;
    feedback.innerHTML = "<span class='text-green-600'>Molt bé! Has encertat! 😊</span>";
  } else {
    const correcteText = correcta.map(i => pregunta.opcions[i]).join("<br>");
    feedback.innerHTML = `<span class='text-red-600'>Ohhh! Ho sento. La resposta correcta és:<br><span class="text-sm text-gray-800">${correcteText}</span></span>`;
  }
}

function mostrarResultats() {
  const seccio = dadesJSON[seccioActual];
  const preguntes = seccio.preguntes;
  const encerts = estatUsuari[seccioActual].encerts;

  document.getElementById("resultatText").textContent = `Has encertat ${encerts} de ${preguntes.length} preguntes.`;
  document.getElementById("resultat").classList.remove("hidden");

  updateProgressBar(preguntes.length, preguntes.length);
}

function updateProgressBar(respostes, total) {
  const percent = (respostes / total) * 100;
  document.getElementById("progress-bar").style.width = `${percent}%`;
}

}
