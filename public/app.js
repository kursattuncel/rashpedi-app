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

// New form elements
const ageYears = document.getElementById('age-years');
const ageMonths = document.getElementById('age-months');
const biologicalSex = document.getElementById('biological-sex');
const temperature = document.getElementById('temperature');
const tempC = document.getElementById('temp-c');
const tempF = document.getElementById('temp-f');

let chart;
let isCelsius = true;

// Temperature unit toggle
tempC.addEventListener('click', () => {
  if (!isCelsius) {
    isCelsius = true;
    tempC.classList.add('active');
    tempF.classList.remove('active');
    convertTemperature();
  }
});

tempF.addEventListener('click', () => {
  if (isCelsius) {
    isCelsius = false;
    tempF.classList.add('active');
    tempC.classList.remove('active');
    convertTemperature();
  }
});

function convertTemperature() {
  const temp = parseFloat(temperature.value);
  if (!isNaN(temp)) {
    if (isCelsius) {
      // Convert F to C
      temperature.value = ((temp - 32) * 5/9).toFixed(1);
    } else {
      // Convert C to F
      temperature.value = (temp * 9/5 + 32).toFixed(1);
    }
  }
}

// Validation functions
function validateAge() {
  const years = parseInt(ageYears.value) || 0;
  const months = parseInt(ageMonths.value) || 0;
  const yearsError = document.getElementById('age-years-error');
  const monthsError = document.getElementById('age-months-error');
  
  let isValid = true;
  
  yearsError.textContent = '';
  monthsError.textContent = '';
  
  if (ageYears.value && (years < 0 || years > 18)) {
    yearsError.textContent = 'Age must be between 0-18 years';
    isValid = false;
  }
  
  if (ageMonths.value && (months < 0 || months > 11)) {
    monthsError.textContent = 'Months must be between 0-11';
    isValid = false;
  }
  
  if (years === 18 && months > 0) {
    monthsError.textContent = 'Cannot exceed 18 years total';
    isValid = false;
  }
  
  return isValid;
}

function validateTemperature() {
  const temp = parseFloat(temperature.value);
  const tempError = document.getElementById('temperature-error');
  
  tempError.textContent = '';
  
  if (!temperature.value) return true; // Optional field
  
  if (isNaN(temp)) {
    tempError.textContent = 'Please enter a valid temperature';
    return false;
  }
  
  if (isCelsius) {
    if (temp < 32 || temp > 45) {
      tempError.textContent = 'Temperature must be between 32-45°C';
      return false;
    }
  } else {
    if (temp < 90 || temp > 113) {
      tempError.textContent = 'Temperature must be between 90-113°F';
      return false;
    }
  }
  
  return true;
}

function validateForm() {
  const isAgeValid = validateAge();
  const isTempValid = validateTemperature();
  return isAgeValid && isTempValid;
}

// Add validation listeners
ageYears.addEventListener('input', () => {
  validateAge();
  enableGo();
});

ageMonths.addEventListener('input', () => {
  validateAge();
  enableGo();
});

temperature.addEventListener('input', () => {
  validateTemperature();
  enableGo();
});

function enableGo() { 
  goBtn.disabled = !fileBlob || !validateForm(); 
}

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
  if (!fileBlob || !validateForm()) return;

  goBtn.disabled = true;
  jsonBox.textContent = 'Analyzing…';
  urgent.style.display = 'none';
  okBadge.style.display = 'none';

  try {
    const fd = new FormData();
    fd.append('photo', fileBlob);
    
    // Add patient metadata
    const patientData = {};
    
    if (ageYears.value || ageMonths.value) {
      const years = parseInt(ageYears.value) || 0;
      const months = parseInt(ageMonths.value) || 0;
      patientData.age_months = years * 12 + months;
    }
    
    if (biologicalSex.value) {
      patientData.biological_sex = biologicalSex.value;
    }
    
    if (temperature.value) {
      const temp = parseFloat(temperature.value);
      // Always send temperature in Celsius to server
      patientData.temperature_celsius = isCelsius ? temp : ((temp - 32) * 5/9);
      patientData.fever_present = patientData.temperature_celsius >= 38.0;
    }
    
    if (Object.keys(patientData).length > 0) {
      fd.append('patient_context', JSON.stringify(patientData));
    }
    
    if (subset.value.trim()) {
      fd.append('diseases', subset.value.trim());
    }

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