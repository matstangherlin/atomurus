/* Live viewer counters, split from viewer-host.js so the shell can report
   them without pulling any viewer code into the bootstrap. */

const counters = { renderers: 0, loops: 0 };

export function viewerStats() {
  return { renderers: counters.renderers, loops: counters.loops };
}

export function trackViewer(kind, delta) {
  counters[kind] += delta;
}
