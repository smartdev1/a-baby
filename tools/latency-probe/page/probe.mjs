/**
 * Role: browser side of the latency probe: pings each selected region over WebSocket, shows p50 / p95 / jitter / loss and exports the run as JSON.
 * Owner: backend
 */

import { summarize } from './rtt-stats.mjs';

const PINGS = 300;
const INTERVAL_MS = 200;
const GRACE_MS = 2000;

const $ = (id) => document.getElementById(id);
const results = [];

const probeRegion = (region) =>
  new Promise((resolve) => {
    const socket = new WebSocket(region.url);
    const rtts = [];
    let sent = 0;
    socket.onmessage = (event) => {
      const { t } = JSON.parse(event.data);
      rtts.push(performance.now() - t);
    };
    socket.onerror = () => resolve({ region: region.id, error: 'connection failed', rttsMs: [], sent });
    socket.onopen = () => {
      const timer = setInterval(() => {
        if (sent >= PINGS) {
          clearInterval(timer);
          setTimeout(() => {
            socket.close();
            resolve({ region: region.id, rttsMs: rtts.map((v) => Math.round(v * 10) / 10), sent });
          }, GRACE_MS);
          return;
        }
        socket.send(JSON.stringify({ seq: sent++, t: performance.now() }));
        $('progress').textContent = `${region.label}: ${sent}/${PINGS}`;
      }, INTERVAL_MS);
    };
  });

const run = async (regions) => {
  const context = {
    operator: $('operator').value,
    access: $('access').value,
    slot: $('slot').value,
    startedAt: new Date().toISOString(),
  };
  for (const region of regions) {
    const raw = await probeRegion(region);
    const summary = summarize(raw.rttsMs, raw.sent);
    results.push({ ...context, ...raw, summary });
    const row = document.createElement('tr');
    row.innerHTML = `<td>${region.label}</td><td>${summary.p50Ms ?? '—'}</td><td>${summary.p95Ms ?? '—'}</td><td>${summary.jitterMs ?? '—'}</td><td>${summary.lossPct ?? '—'}</td>`;
    $('rows').appendChild(row);
  }
  $('progress').textContent = 'Terminé — téléchargez le fichier et envoyez-le.';
  $('download').disabled = false;
};

const regions = await (await fetch('/regions.json')).json();
$('start').onclick = () => {
  $('start').disabled = true;
  void run(regions);
};
$('download').onclick = () => {
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `latency-${results[0]?.operator}-${results[0]?.access}-${results[0]?.slot}.json`,
  });
  a.click();
};
