(function () {
  "use strict";

  var englishNameBySymbol = {
    H: "Hydrogen", He: "Helium", Li: "Lithium", C: "Carbon", N: "Nitrogen",
    O: "Oxygen", F: "Fluorine", Ne: "Neon", Na: "Sodium", Mg: "Magnesium",
    Al: "Aluminium", Si: "Silicon", P: "Phosphorus", S: "Sulfur", Cl: "Chlorine",
    Ar: "Argon", K: "Potassium", Ca: "Calcium", Ti: "Titanium", Cr: "Chromium",
    Mn: "Manganese", Fe: "Iron", Co: "Cobalt", Ni: "Nickel", Cu: "Copper",
    Zn: "Zinc", Br: "Bromine", Kr: "Krypton", Ag: "Silver", Sn: "Tin",
    I: "Iodine", Xe: "Xenon", W: "Tungsten", Pt: "Platinum", Au: "Gold",
    Hg: "Mercury", Pb: "Lead", Bi: "Bismuth", Rn: "Radon", U: "Uranium"
  };

  var categoryLabels = {
    alkali: "Alkali metal",
    alkaline: "Alkaline earth metal",
    transition: "Transition metal",
    posttrans: "Post-transition metal",
    metalloid: "Metalloid",
    nonmetal: "Reactive nonmetal",
    polyatomic: "Reactive nonmetal",
    noble: "Noble gas",
    lanthanide: "Lanthanide",
    actinide: "Actinide"
  };

  var stateLabels = {
    "Solido": "Solid",
    "Sólido": "Solid",
    "Liquido": "Liquid",
    "Líquido": "Liquid",
    "Gasoso": "Gas",
    "Desconhecido": "Unknown"
  };

  var initialElement = {
    editorial: 83,
    instrument: 26,
    future: 10
  };

  function englishName(element) {
    return englishNameBySymbol[element.sym] || ("Element " + String(element.z).padStart(3, "0"));
  }

  function englishState(value) {
    return stateLabels[value] || value || "Unknown";
  }

  function updateInspector(concept, element) {
    if (!concept || !element) return;

    var values = {
      "[data-inspector-symbol]": element.sym,
      "[data-inspector-number]": String(element.z),
      "[data-inspector-name]": englishName(element),
      "[data-inspector-mass]": element.mass + " u",
      "[data-inspector-state]": englishState(element.state),
      "[data-inspector-category]": categoryLabels[element.cat] || "Chemical element"
    };

    Object.keys(values).forEach(function (selector) {
      concept.querySelectorAll(selector).forEach(function (node) {
        node.textContent = values[selector];
      });
    });

    concept.querySelectorAll(".periodic-cell").forEach(function (cell) {
      cell.classList.toggle("is-active", Number(cell.dataset.atomicNumber) === element.z);
    });
  }

  function buildPeriodicTable(table) {
    if (typeof ELEMENTS === "undefined") return;

    var concept = table.closest("[data-concept]");
    var conceptName = table.dataset.periodic;

    ELEMENTS.forEach(function (element) {
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "periodic-cell cat-" + element.cat;
      cell.style.gridColumn = String(element.col);
      cell.style.gridRow = String(element.row);
      cell.dataset.atomicNumber = String(element.z);
      cell.setAttribute(
        "aria-label",
        englishName(element) + ", atomic number " + element.z + ", atomic mass " + element.mass
      );
      cell.innerHTML = "<small>" + element.z + "</small><b>" + element.sym + "</b>";

      cell.addEventListener("pointerenter", function () {
        updateInspector(concept, element);
      });
      cell.addEventListener("focus", function () {
        updateInspector(concept, element);
      });
      cell.addEventListener("click", function () {
        updateInspector(concept, element);
      });

      table.appendChild(cell);
    });

    var selected = ELEMENTS.find(function (element) {
      return element.z === initialElement[conceptName];
    });
    updateInspector(concept, selected);
  }

  function setView(view, shouldScroll) {
    var validViews = ["all", "editorial", "instrument", "future"];
    if (validViews.indexOf(view) === -1) view = "all";

    document.body.dataset.view = view;
    document.querySelectorAll("[data-view-button]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.viewButton === view));
    });

    var exit = document.querySelector("[data-focus-exit]");
    if (exit) exit.hidden = view === "all";

    if (view === "all") {
      history.replaceState(null, "", window.location.pathname);
      if (shouldScroll) {
        document.querySelector(".concept-grid").scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    history.replaceState(null, "", "#" + view);
    if (shouldScroll) {
      var target = document.getElementById(view);
      if (target) {
        window.setTimeout(function () {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 40);
      }
    }
  }

  document.querySelectorAll("[data-periodic]").forEach(buildPeriodicTable);

  document.querySelectorAll("[data-view-button]").forEach(function (button) {
    button.addEventListener("click", function () {
      setView(button.dataset.viewButton, true);
    });
  });

  document.querySelectorAll("[data-focus]").forEach(function (button) {
    button.addEventListener("click", function () {
      setView(button.dataset.focus, true);
    });
  });

  var motionToggle = document.querySelector("[data-motion-toggle]");
  if (motionToggle) {
    motionToggle.addEventListener("click", function () {
      var paused = document.body.classList.toggle("motion-paused");
      motionToggle.setAttribute("aria-pressed", String(paused));
      var label = motionToggle.querySelector("[data-motion-label]");
      if (label) label.textContent = paused ? "Motion off" : "Motion on";
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.body.dataset.view !== "all") {
      setView("all", true);
    }
  });

  var hashView = window.location.hash.replace("#", "");
  if (["editorial", "instrument", "future"].indexOf(hashView) !== -1) {
    setView(hashView, false);
  }
})();
