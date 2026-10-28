/* Minimal stand-in for Chart.js (cdn.jsdelivr.net is blocked in the tests).
   It records every chart built so a test can check what the page asked for,
   and answers the calls periodic-table.js makes without drawing anything. */
(function () {
  function permissive() {
    const fn = function () { return permissive(); };
    return new Proxy(fn, {
      get(target, key) {
        if (key === Symbol.toPrimitive) return () => 0;
        if (key === 'then') return undefined;
        if (key === Symbol.iterator) return function* () {};
        if (key === 'length') return 0;
        if (!(key in target)) target[key] = permissive();
        return target[key];
      },
      set(target, key, value) { target[key] = value; return true; },
      apply() { return permissive(); }
    });
  }
  function scale(count) {
    return {
      min: 0, max: Math.max(0, count - 1), left: 0, right: 300, top: 0, bottom: 150, width: 300, height: 150,
      ticks: [], getPixelForValue: () => 0, getValueForPixel: () => 0
    };
  }
  class Chart {
    constructor(ctx, config) {
      this.ctx = ctx;
      this.canvas = ctx && ctx.canvas;
      this.config = config || {};
      this.data = this.config.data || { labels: [], datasets: [] };
      this.options = this.config.options || {};
      this.chartArea = { left: 0, right: 300, top: 0, bottom: 150, width: 300, height: 150 };
      this.scales = { x: scale((this.data.labels || []).length), y: scale(2) };
      (window.__charts = window.__charts || []).push(this);
    }
    update() {}
    destroy() { this.destroyed = true; }
    pan() {}
    zoom() {}
    zoomScale() {}
    resetZoom() {}
    resize() {}
    render() {}
    draw() {}
    stop() {}
    getDatasetMeta() { return { data: [], hidden: false }; }
    getElementsAtEventForMode() { return []; }
    isDatasetVisible() { return true; }
    setActiveElements() {}
    getActiveElements() { return []; }
    toBase64Image() { return 'data:image/png;base64,'; }
    isZoomedOrPanned() { return false; }
    getZoomLevel() { return 1; }
  }
  Chart.register = function () {};
  Chart.unregister = function () {};
  Chart.registry = { plugins: { get: function () { return { id: 'zoom' }; } } };
  Chart.defaults = permissive();
  Chart.helpers = permissive();
  window.Chart = Chart;
})();
