(function () {
  "use strict";

  var themes = {
    caderno: {
      label: "Caderno de Matéria",
      color: "#eee9de"
    },
    observatorio: {
      label: "Observatório Silencioso",
      color: "#101719"
    },
    instrumento: {
      label: "Instrumento Humano",
      color: "#dfe1dc"
    }
  };

  var params = new URLSearchParams(window.location.search);
  var selected = params.get("tema");
  if (!themes[selected]) selected = "caderno";

  document.body.classList.remove("theme-caderno", "theme-observatorio", "theme-instrumento");
  document.body.classList.add("theme-" + selected);

  var metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", themes[selected].color);

  document.querySelectorAll("[data-theme-link]").forEach(function (link) {
    link.toggleAttribute("aria-current", link.dataset.themeLink === selected);
  });

  var themeName = document.querySelector("[data-theme-name]");
  if (themeName) themeName.textContent = themes[selected].label;

  var menu = document.querySelector("[data-menu]");
  var nav = document.querySelector("[data-minimal-nav]");
  if (menu && nav) {
    menu.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menu.setAttribute("aria-expanded", String(open));
    });
  }

  var clock = document.querySelector("[data-clock]");
  function updateClock() {
    if (!clock) return;
    var now = new Date();
    clock.textContent = [
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0")
    ].join(":") + " local";
  }
  updateClock();
  window.setInterval(updateClock, 1000);

  var categoryMap = {
    alkali: "alkali",
    alkaline: "alkaline",
    transition: "transition",
    posttrans: "post",
    metalloid: "metalloid",
    nonmetal: "nonmetal",
    polyatomic: "nonmetal",
    noble: "noble",
    lanthanide: "lanthanide",
    actinide: "actinide"
  };

  function buildPeriodicTable() {
    var table = document.getElementById("minimal-periodic");
    if (!table || typeof ELEMENTS === "undefined") return;

    var positions = {};
    ELEMENTS.forEach(function (element) {
      positions[element.col + "-" + element.row] = element;
    });

    for (var row = 1; row <= 10; row += 1) {
      if (row === 8) {
        var gap = document.createElement("span");
        gap.className = "minimal-table-gap";
        table.appendChild(gap);
        continue;
      }

      for (var col = 1; col <= 18; col += 1) {
        var element = positions[col + "-" + row];
        var cell = document.createElement(element ? "a" : "span");
        cell.className = "minimal-element";

        if (element) {
          cell.classList.add(categoryMap[element.cat] || "nonmetal");
          cell.href = "../periodic-table.pt.html#q=" + encodeURIComponent(element.sym);
          cell.innerHTML = "<small>" + element.z + "</small><b>" + element.sym + "</b>";
          cell.setAttribute("aria-label", element.name + ", número atômico " + element.z);
          cell.dataset.number = String(element.z).padStart(3, "0");
          cell.dataset.symbol = element.sym;
          cell.dataset.name = element.name;
        } else {
          cell.classList.add("is-empty");
          cell.setAttribute("aria-hidden", "true");
        }
        table.appendChild(cell);
      }
    }

    var focus = document.querySelector("[data-periodic-focus]");
    var focusNumber = document.querySelector("[data-focus-number]");
    var focusSymbol = document.querySelector("[data-focus-symbol]");
    var focusName = document.querySelector("[data-focus-name]");

    table.querySelectorAll("a.minimal-element").forEach(function (cell) {
      cell.addEventListener("pointerenter", function () {
        focusNumber.textContent = cell.dataset.number;
        focusSymbol.textContent = cell.dataset.symbol;
        focusName.textContent = cell.dataset.name;
        focus.classList.add("is-active");
      });
    });

    table.addEventListener("pointerleave", function () {
      focusNumber.textContent = "006";
      focusSymbol.textContent = "C";
      focusName.textContent = "Carbono";
      focus.classList.remove("is-active");
    });
  }

  buildPeriodicTable();
})();
