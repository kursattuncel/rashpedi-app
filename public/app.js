let fileBlob = null;
const fileInput = document.getElementById('file');
const drop = document.getElementById('drop');
const goBtn = document.getElementById('go');
const preview = document.getElementById('preview');
const thumb = document.getElementById('thumb');
const subset = document.getElementById('subset');
const jsonBox = document.getElementById('json');
const urgent = document.getElementById('urgent');
const okBadge = document.getElementById('ok');

let chart;

function enableGo() { goBtn.disabled = !fileBlob; }

drop.addEventListener('click', () => fileInput.click());
drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.borderColor = '#7dd3fc'; });
drop.addEventListener('dragleave', () => { drop.style.borderColor = 'rgba(255,255,255,0.22)'; });
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  drop.style.borderColor = 'rgba(255,255,255,0.22)';
  const f = e.dataTransfer.files?.[0];
  if (f) handleFile(f);
});
fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) handleFile(f);
});

function handleFile(f) {
  if (!f.type.startsWith('image/')) return alert('Please select an image.');
  if (f.size > 5 * 1024 * 1024) return alert('Max file size is 5 MB.');
  fileBlob = f;
  enableGo();
  const reader = new FileReader();
  reader.onload = () => {
    thumb.src = reader.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(f);
}

goBtn.addEventListener('click', async () => {
  if (!fileBlob) return;

  goBtn.disabled = true;
  jsonBox.textContent = 'Analyzing…';
  urgent.style.display = 'none';
  okBadge.style.display = 'none';

  try {
    const fd = new FormData();
    fd.append('photo', fileBlob);
    if (subset.value.trim()) fd.append('diseases', subset.value.trim());

    const r = await fetch('/api/analyze', { method: 'POST', body: fd });
    const txt = await r.text();
    let data = null;

    try { data = JSON.parse(txt); } catch {
      jsonBox.textContent = 'Invalid JSON from server.';
      goBtn.disabled = false;
      return;
    }

    jsonBox.textContent = JSON.stringify(data, null, 2);

    if (Array.isArray(data.red_flags) && data.red_flags.length > 0) {
      urgent.style.display = 'inline-flex';
      okBadge.style.display = 'none';
    } else if (data.labels) {
      urgent.style.display = 'none';
      okBadge.style.display = 'inline-flex';
    }

    if (Array.isArray(data.labels)) {
      const labels = data.labels.map(d => d.name);
      const values = data.labels.map(d => Number(d.match ?? 0));

      if (chart) chart.destroy();
      const ctx = document.getElementById('chart').getContext('2d');
      chart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Match score (0–1)', data: values }] },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true, suggestedMax: 1 } },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw}` } } }
        }
      });
    }
  } catch (err) {
    console.error(err);
    jsonBox.textContent = 'Error: ' + (err?.message || String(err));
  } finally {
    goBtn.disabled = false;
  }
});
