(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var menuButton = document.querySelector("[data-menu-button]");
  var nav = document.querySelector("[data-nav]");

  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(open));
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  document.querySelectorAll("[data-reveal]").forEach(function (element) {
    observer.observe(element);
  });

  document.querySelectorAll("[data-year]").forEach(function (element) {
    element.textContent = new Date().getFullYear();
  });

  var field = document.querySelector("[data-orbit-field]");
  if (field && window.matchMedia("(pointer: fine)").matches) {
    field.addEventListener("pointermove", function (event) {
      var rect = field.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      field.style.setProperty("--mx", (x * 14).toFixed(2) + "px");
      field.style.setProperty("--my", (y * 14).toFixed(2) + "px");
    });

    field.addEventListener("pointerleave", function () {
      field.style.setProperty("--mx", "0px");
      field.style.setProperty("--my", "0px");
    });
  }

  document.querySelectorAll("[data-element-pick]").forEach(function (button) {
    button.addEventListener("click", function () {
      var root = button.closest("[data-element-console]");
      if (!root) return;
      root.querySelectorAll("[data-element-pick]").forEach(function (item) {
        item.classList.toggle("is-active", item === button);
      });
      root.querySelector("[data-element-symbol]").textContent = button.dataset.symbol;
      root.querySelector("[data-element-name]").textContent = button.dataset.name;
      root.querySelector("[data-element-number]").textContent = button.dataset.number;
      root.querySelector("[data-element-mass]").textContent = button.dataset.mass;
      root.querySelector("[data-element-state]").textContent = button.dataset.state;
    });
  });

  var archiveRows = document.querySelectorAll("[data-archive-row]");
  archiveRows.forEach(function (row) {
    row.addEventListener("mouseenter", function () {
      archiveRows.forEach(function (item) {
        item.classList.toggle("is-muted", item !== row);
      });
    });
    row.addEventListener("mouseleave", function () {
      archiveRows.forEach(function (item) {
        item.classList.remove("is-muted");
      });
    });
  });

  var chamber = document.querySelector("[data-chamber]");
  var chamberButton = document.querySelector("[data-chamber-button]");
  if (chamber && chamberButton) {
    chamberButton.addEventListener("click", function () {
      var active = chamber.classList.toggle("is-running");
      chamberButton.textContent = active ? "Interromper ensaio" : "Iniciar ensaio";
      chamberButton.setAttribute("aria-pressed", String(active));
      var status = chamber.querySelector("[data-chamber-status]");
      if (status) status.textContent = active ? "REAÇÃO EM CURSO" : "SISTEMA ESTÁVEL";
    });
  }
})();
