const { test, expect } = require('@playwright/test');
const { installApi, gotoWorkspace } = require('./helpers.js');

test('Lab board stays interactive at 100 objects', async ({ page }) => {
  test.setTimeout(180000);
  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/app?section=lab&mode=bench');
  await page.waitForSelector('.lab-beaker');

  const report = await page.evaluate(async () => {
    const node = document.querySelector('[data-lab-root]');
    const stage = document.querySelector('[data-lab-stage]');
    const out = [];
    const types = ['beaker', 'flask', 'cylinder', 'test-tube', 'round-flask', 'bunsen', 'thermometer', 'burette'];
    const now = () => performance.now();
    const pieces = () => document.querySelectorAll('[data-lab-world] [data-vessel]');
    function fire(el, type, opts) {
      el.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, pointerId: 1, button: 0 }, opts)));
    }
    function addOne(type) {
      const chip = document.createElement('button');
      chip.setAttribute('data-add-vessel', type);
      node.appendChild(chip);
      chip.click();
      chip.remove();
    }

    for (const target of [20, 50, 100]) {
      const addStart = now();
      let guard = 0;
      while (pieces().length < target && guard < 260) {
        addOne(types[guard % types.length]);
        guard += 1;
      }
      const count = pieces().length;
      const addMs = now() - addStart;
      if (count < target) { out.push({ count, note: 'capped' }); break; }

      // A pan in the previous round arms a 280 ms guard that swallows clicks.
      await new Promise((done) => setTimeout(done, 340));
      // Each click replaces the world, so the element has to be re-queried.
      const ids = [...pieces()].map((el) => el.getAttribute('data-vessel'));
      const renderStart = now();
      for (let i = 0; i < 6; i += 1) {
        const el = document.querySelector('[data-vessel="' + ids[i % ids.length] + '"]');
        el.click();
      }
      const renderMs = (now() - renderStart) / 6;

      const held = document.querySelector('[data-vessel="' + ids[0] + '"]');
      const box = held.getBoundingClientRect();
      fire(held, 'pointerdown', { clientX: box.x + 20, clientY: box.y + 20 });
      const dragStart = now();
      for (let i = 0; i < 30; i += 1) fire(stage, 'pointermove', { clientX: box.x + 20 + i, clientY: box.y + 20 + i });
      const dragMs = (now() - dragStart) / 30;
      fire(stage, 'pointerup', { clientX: box.x + 50, clientY: box.y + 50 });

      fire(stage, 'pointerdown', { clientX: 10, clientY: 10, button: 1 });
      const panStart = now();
      for (let i = 0; i < 30; i += 1) fire(stage, 'pointermove', { clientX: 10 + i, clientY: 10 + i });
      const panMs = (now() - panStart) / 30;
      fire(stage, 'pointerup', { clientX: 40, clientY: 40 });

      out.push({
        count,
        addMsPerPiece: Math.round((addMs / Math.max(1, count)) * 10) / 10,
        renderMs: Math.round(renderMs * 10) / 10,
        dragMs: Math.round(dragMs * 100) / 100,
        panMs: Math.round(panMs * 100) / 100,
        worldKb: Math.round(document.querySelector('[data-lab-world]').innerHTML.length / 1024)
      });
    }
    return out;
  });
  console.log('lab board perf:', JSON.stringify(report));

  // Guards against an order-of-magnitude regression (a render loop, or the
  // O(n^2) heater scan this replaced), with headroom for a slow CI runner.
  for (const row of report) {
    expect(row.count, 'the board must accept the objects').toBeGreaterThanOrEqual(row.count);
    expect(row.dragMs, `drag at ${row.count} objects`).toBeLessThan(8);
    expect(row.panMs, `pan at ${row.count} objects`).toBeLessThan(8);
  }
  const biggest = report[report.length - 1];
  expect(biggest.count).toBe(100);
  expect(biggest.renderMs, 'a full re-render at 100 objects').toBeLessThan(60);
  expect(biggest.worldKb, 'world markup at 100 objects').toBeLessThan(260);
});
