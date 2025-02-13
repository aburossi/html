(function() {
    // Data: 8 Aspekte (name & definition)
    const aspekte = [
      { name: "Mensch & Gesellschaft", definition: "Verstehen sozialer Strukturen und menschlicher Beziehungen." },
      { name: "Natur & Technik", definition: "Erfassen der Grundlagen naturwissenschaftlicher und technologischer Entwicklungen." },
      { name: "Sprache & Kommunikation", definition: "Förderung von Ausdrucksfähigkeit und Verständigung." },
      { name: "Kunst & Kultur", definition: "Wertschätzung kreativer Ausdrucksformen und kultureller Vielfalt." },
      { name: "Mathematik & Logik", definition: "Entwicklung von analytischem Denken und Problemlösungsfähigkeiten." },
      { name: "Wirtschaft & Recht", definition: "Einblick in wirtschaftliche Zusammenhänge und rechtliche Rahmenbedingungen." },
      { name: "Gesundheit & Ernährung", definition: "Verständnis für den eigenen Körper und bewusste Lebensführung." },
      { name: "Umwelt & Nachhaltigkeit", definition: "Reflexion ökologischer Zusammenhänge und Verantwortung gegenüber der Natur." }
    ];
  
    let currentIndex = 0;
    let intervalID = null;
    let slideDuration = 5000; // Default: 5 seconds per slide
  
    // DOM Elements
    const cylinder = document.getElementById("cylinder");
    const aspectList = document.getElementById("aspectList");
    const restartButton = document.getElementById("restartButton");
    const speedSlider = document.getElementById("speedSlider");
    const speedValue = document.getElementById("speedValue");
  
    // Populate the sidebar list
    function initializeSidebar() {
      aspekte.forEach((aspect, index) => {
        const li = document.createElement("li");
        li.textContent = aspect.name;
        li.addEventListener("click", () => {
          stopLoop();
          currentIndex = index;
          showSlide(index);
        });
        aspectList.appendChild(li);
      });
    }
  
    // Highlight the active sidebar item
    function updateActiveSidebar(index) {
      Array.from(aspectList.getElementsByTagName("li")).forEach(li => li.classList.remove("active"));
      const listItem = aspectList.getElementsByTagName("li")[index];
      if (listItem) listItem.classList.add("active");
    }
  
    // Show a slide by rotating the cylinder and updating the front face
    function showSlide(index) {
      // Rotate the cylinder so that the face with data-face=index is front (multiples of 45deg)
      const angle = index * 45;
      cylinder.style.transform = `rotateY(-${angle}deg)`;
      updateActiveSidebar(index);
  
      // Clear all faces’ content and mark them as empty
      document.querySelectorAll(".face").forEach(face => {
        face.innerHTML = "";
        face.classList.add("empty");
      });
      // Set the content only on the face that becomes front
      const faceEl = document.querySelector(`.face[data-face="${index}"]`);
      if (faceEl) {
        faceEl.innerHTML = `<h2>${aspekte[index].name}</h2>
                            <p>${aspekte[index].definition}</p>`;
        faceEl.classList.remove("empty");
      }
    }
  
    // Start the autoplay loop
    function startLoop() {
      stopLoop();
      intervalID = setInterval(() => {
        showSlide(currentIndex);
        currentIndex = (currentIndex + 1) % aspekte.length;
      }, slideDuration);
    }
  
    // Stop the autoplay loop
    function stopLoop() {
      if (intervalID !== null) {
        clearInterval(intervalID);
        intervalID = null;
      }
    }
  
    // Restart button resets to the first slide
    restartButton.addEventListener("click", () => {
      currentIndex = 0;
      showSlide(currentIndex);
      startLoop();
    });
  
    // Adjust slide duration using the speed slider
    speedSlider.addEventListener("input", () => {
      speedValue.textContent = speedSlider.value;
      slideDuration = speedSlider.value * 1000;
      if (intervalID !== null) {
        startLoop();
      }
    });
  
    // Initialization
    function init() {
      initializeSidebar();
      showSlide(currentIndex);
      startLoop();
    }
    init();
  })();
  