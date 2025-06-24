// test-actic3.js
let dadesJSON;
let estatUsuari = JSON.parse(localStorage.getItem("progresACTIC3")) || {};
let seccioActual = null;
let cuaPreguntes = [];

fetch("preguntes-actic3.json")
  .then((res) => res.json())
  .then((data) => {
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
  const container = document.getElementById("sectionButtons");
  container.innerHTML = "";
  Object.keys(dadesJSON).forEach((clau) => {
    const boto = document.createElement("button");
    boto.textContent = dadesJSON[clau].titol;
    boto.className = "bg-blue-500/50 hover:bg-blue-500 text-[10px] px-2 py-1 rounded leading-tight break-words max-w-[10rem] w-fit";
    boto.onclick = () => {
      document.querySelectorAll("#sectionButtons button").forEach((b) => b.classList.remove("active-section"));
      boto.classList.add("active-section");

      seccioActual = clau;
      estatUsuari[clau] = estatUsuari[clau] || { respostes: {}, encerts: 0, dificils: [] };
      cuaPreguntes = dadesJSON[clau].preguntes.filter((p) => !estatUsuari[clau].respostes[p.id]);
      document.getElementById("resultat").classList.add("hidden");
      document.getElementById("progress-container").classList.remove("hidden");
      mostrarPregunta();
    };
    container.appendChild(boto);
  });

  document.getElementById("exportarBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(estatUsuari)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "progres-actic3.json";
    link.click();
  };

  document.getElementById("importarInput").addEventListener("change", (e) => {
    const fitxer = e.target.files[0];
    if (!fitxer) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      estatUsuari = JSON.parse(event.target.result);
      localStorage.setItem("progresACTIC3", JSON.stringify(estatUsuari));
      location.reload();
    };
    reader.readAsText(fitxer);
  });
}

function mostrarPregunta() {
  const container = document.getElementById("test-container");
  if (cuaPreguntes.length === 0) return mostrarResultats();

  const pregunta = cuaPreguntes[0];
  const respostesUsuari = estatUsuari[seccioActual].respostes;
  const correcta = Array.isArray(pregunta.correcta) ? pregunta.correcta : [pregunta.correcta];

  updateProgressBar(Object.keys(respostesUsuari).length, dadesJSON[seccioActual].preguntes.length);

  let contingut = `<div class="p-4 border rounded-xl bg-gray-50">
    <p class="font-medium mb-2">${pregunta.text}</p>
    <div id="opcions" class="space-y-2"></div>
    <p id="feedback" class="text-sm font-medium mt-2"></p>
    <button id="marcaDificil" class="mt-2 text-sm text-blue-600 underline">Marca com a difícil</button>
    <div class="mt-4">
      <button id="seguentBtn" class="hidden bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Següent</button>
    </div>
  </div>`;

  container.innerHTML = contingut;

  const opcionsDiv = document.getElementById("opcions");

  if (pregunta.tipus === "relacionar") {
    pregunta.parells.forEach((parell, i) => {
      const div = document.createElement("div");
      div.className = "flex items-center gap-2";
      div.innerHTML = `<span>${parell[0]}</span>
        <select class="border p-1 rounded" data-index="${i}">
          <option value="">Selecciona</option>
          ${pregunta.parells.map((p, idx) => `<option value="${idx}">${p[1]}</option>`).join('')}
        </select>`;
      opcionsDiv.appendChild(div);
    });
  } else if (pregunta.tipus === "completar") {
    const select = document.createElement("select");
    select.className = "border p-1 rounded";
    select.innerHTML = pregunta.opcions.map((opcio, i) => `<option value="${i}">${opcio}</option>`).join('');
    opcionsDiv.appendChild(select);
  } else {
    const tipus = pregunta.tipus === "multiseleccio" ? "checkbox" : "radio";
    pregunta.opcions.forEach((text, i) => {
      const label = document.createElement("label");
      label.className = "block bg-white border px-3 py-2 rounded cursor-pointer hover:bg-blue-50";
      label.innerHTML = `<input type="${tipus}" name="preg-${pregunta.id}" value="${i}" class="mr-2">${text}`;
      opcionsDiv.appendChild(label);
    });
  }

  const feedback = document.getElementById("feedback");

  const comprovarResposta = () => {
    let seleccionats = [];

    if (pregunta.tipus === "relacionar") {
      const selects = opcionsDiv.querySelectorAll("select");
      seleccionats = Array.from(selects).map(s => parseInt(s.value));
      const encert = seleccionats.every((val, idx) => val === idx);
      mostrarFeedback(encert, correcta, pregunta);
      estatUsuari[seccioActual].respostes[pregunta.id] = seleccionats;
    } else if (pregunta.tipus === "completar") {
      const valor = parseInt(opcionsDiv.querySelector("select").value);
      const encert = correcta.includes(valor);
      mostrarFeedback(encert, correcta, pregunta);
      estatUsuari[seccioActual].respostes[pregunta.id] = [valor];
    } else {
      const inputs = opcionsDiv.querySelectorAll("input");
      seleccionats = Array.from(inputs).filter(i => i.checked).map(i => parseInt(i.value));
      const encert = JSON.stringify(seleccionats.sort()) === JSON.stringify(correcta.sort());
      mostrarFeedback(encert, correcta, pregunta);
      estatUsuari[seccioActual].respostes[pregunta.id] = seleccionats;
      inputs.forEach(i => i.disabled = true);
    }

    localStorage.setItem("progresACTIC3", JSON.stringify(estatUsuari));
    document.getElementById("seguentBtn").classList.remove("hidden");
  };

  if (["relacionar", "completar"].includes(pregunta.tipus)) {
    const btn = document.createElement("button");
    btn.textContent = "Comprovar";
    btn.className = "mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700";
    btn.onclick = comprovarResposta;
    opcionsDiv.appendChild(btn);
  } else {
    opcionsDiv.querySelectorAll("input").forEach(input => {
      input.addEventListener("change", comprovarResposta);
    });
  }

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
    const correcteText = correcta.map(i => {
      if (pregunta.tipus === "relacionar") return `${pregunta.parells[i][0]} → ${pregunta.parells[i][1]}`;
      if (pregunta.tipus === "completar" || pregunta.tipus === "unica" || pregunta.tipus === "multiseleccio") return pregunta.opcions[i];
      return i;
    }).join("<br>");
    feedback.innerHTML = `<span class='text-red-600'>Ohhh! Ho sento. La resposta correcta és:<br><span class="text-sm text-gray-800">${correcteText}</span></span>`;
  }
}

function updateProgressBar(respostes, total) {
  const percent = (respostes / total) * 100;
  document.getElementById("progress-bar").style.width = `${percent}%`;
}

function mostrarResultats() {
  const seccio = dadesJSON[seccioActual];
  const preguntes = seccio.preguntes;
  const encerts = estatUsuari[seccioActual].encerts;

  document.getElementById("resultatText").textContent = `Has encertat ${encerts} de ${preguntes.length} preguntes.`;
  document.getElementById("resultat").classList.remove("hidden");

  updateProgressBar(preguntes.length, preguntes.length);
}
