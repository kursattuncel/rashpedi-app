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
const tempSlider = document.getElementById('temp-slider');
const tempStatus = document.getElementById('temp-status');
const tempC = document.getElementById('temp-c');
const tempF = document.getElementById('temp-f');

// Body diagram elements
const selectedBodyPartsDisplay = document.getElementById('selected-body-parts');
const resetBodyPartsBtn = document.getElementById('reset-body-parts');
let selectedBodyParts = new Set();

// Medical history elements
const medication = document.getElementById('medication');
const isAntibiotic = document.getElementById('is-antibiotic');
const measlesVaccine = document.getElementById('measles-vaccine');
const chickenpoxVaccine = document.getElementById('chickenpox-vaccine');
const generalCondition = document.getElementById('general-condition');

// Symptom checkboxes
const soreThroat = document.getElementById('sore-throat');
const cough = document.getElementById('cough');
const vomiting = document.getElementById('vomiting');
const diarrhea = document.getElementById('diarrhea');
const shortnessBreath = document.getElementById('shortness-breath');

function updateSelectedBodyParts() {
  if (selectedBodyParts.size === 0) {
    selectedBodyPartsDisplay.textContent = 'None';
  } else {
    selectedBodyPartsDisplay.textContent = Array.from(selectedBodyParts).join(', ');
  }
}

function resetBodyParts() {
  selectedBodyParts.clear();
  document.querySelectorAll('.body-part.selected').forEach(part => {
    part.classList.remove('selected');
  });
  updateSelectedBodyParts();
}

// Reset button event listener
resetBodyPartsBtn.addEventListener('click', resetBodyParts);

// Single event handler for body diagram interaction
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('body-part')) {
    e.preventDefault();
    e.stopPropagation();
    
    const partName = e.target.dataset.part;
    if (!partName) return;
    
    // Find all elements with the same data-part (like arms and legs which appear on both front/back)
    const allSameParts = document.querySelectorAll(`[data-part="${partName}"]`);
    
    if (selectedBodyParts.has(partName)) {
      // Remove selection
      selectedBodyParts.delete(partName);
      allSameParts.forEach(part => part.classList.remove('selected'));
    } else {
      // Add selection
      selectedBodyParts.add(partName);
      allSameParts.forEach(part => part.classList.add('selected'));
    }
    
    updateSelectedBodyParts();
  }
});

let chart;
let isCelsius = true;
tempC.addEventListener('click', () => {
  if (!isCelsius) {
    isCelsius = true;
    tempC.classList.add('active');
    tempF.classList.remove('active');
    convertTemperature();
    updateSliderScale();
  }
});

tempF.addEventListener('click', () => {
  if (isCelsius) {
    isCelsius = false;
    tempF.classList.add('active');
    tempC.classList.remove('active');
    convertTemperature();
    updateSliderScale();
  }
});

function convertTemperature() {
  const temp = parseFloat(temperature.value);
  if (!isNaN(temp)) {
    if (isCelsius) {
      // Convert F to C
      const newTemp = ((temp - 32) * 5/9);
      temperature.value = newTemp.toFixed(1);
      tempSlider.value = newTemp.toFixed(1);
      updateSliderScale();
    } else {
      // Convert C to F  
      const newTemp = (temp * 9/5 + 32);
      temperature.value = newTemp.toFixed(1);
      tempSlider.value = newTemp.toFixed(1);
      updateSliderScale();
    }
  } else {
    // Set default values when no temperature is entered
    if (isCelsius) {
      tempSlider.value = "37.0";
    } else {
      tempSlider.value = "98.6";
    }
    updateSliderScale();
  }
}

function updateSliderScale() {
  const labels = document.querySelector('.temp-labels');
  if (isCelsius) {
    tempSlider.min = "35";
    tempSlider.max = "42";
    labels.innerHTML = '<span>35°C</span><span>Normal (36.1-37.2°C)</span><span>Fever (≥38°C)</span><span>42°C</span>';
  } else {
    tempSlider.min = "95";
    tempSlider.max = "107.6";
    labels.innerHTML = '<span>95°F</span><span>Normal (97-99°F)</span><span>Fever (≥100.4°F)</span><span>107.6°F</span>';
  }
  updateTemperatureStatus();
}

function updateTemperatureStatus() {
  const temp = parseFloat(temperature.value);
  if (isNaN(temp)) {
    tempStatus.textContent = "Enter temperature";
    tempStatus.className = "temp-status temp-normal";
    return;
  }

  let tempInCelsius = isCelsius ? temp : ((temp - 32) * 5/9);
  
  if (tempInCelsius < 36.1) {
    tempStatus.textContent = "Below Normal";
    tempStatus.className = "temp-status temp-normal";
  } else if (tempInCelsius <= 37.2) {
    tempStatus.textContent = "Normal Temperature";
    tempStatus.className = "temp-status temp-normal";
  } else if (tempInCelsius < 38.0) {
    tempStatus.textContent = "Slightly Elevated";
    tempStatus.className = "temp-status temp-elevated";
  } else {
    tempStatus.textContent = "Fever Detected";
    tempStatus.className = "temp-status temp-fever";
  }
}

// Sync slider and input with better precision
function syncTemperatureInputs(source) {
  if (source === 'slider') {
    const sliderValue = parseFloat(tempSlider.value);
    temperature.value = sliderValue.toFixed(1);
  } else if (source === 'input') {
    const inputValue = parseFloat(temperature.value);
    if (!isNaN(inputValue)) {
      // Clamp the input value to slider range
      const min = parseFloat(tempSlider.min);
      const max = parseFloat(tempSlider.max);
      const clampedValue = Math.max(min, Math.min(max, inputValue));
      tempSlider.value = clampedValue;
      if (clampedValue !== inputValue) {
        temperature.value = clampedValue.toFixed(1);
      }
    }
  }
  updateTemperatureStatus();
  validateTemperature();
  enableGo();
}

// Enhanced temperature input listeners with real-time sync
tempSlider.addEventListener('input', () => syncTemperatureInputs('slider'));
tempSlider.addEventListener('change', () => syncTemperatureInputs('slider'));
temperature.addEventListener('input', () => syncTemperatureInputs('input'));
temperature.addEventListener('change', () => syncTemperatureInputs('input'));

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

// Clear previous results
function clearPreviousResults() {
  // Remove any existing triage indicators
  const existingTriage = document.querySelectorAll('.triage-indicator');
  existingTriage.forEach(indicator => indicator.remove());
  
  // Remove any existing quality warnings
  const existingWarnings = document.querySelectorAll('.quality-warning');
  existingWarnings.forEach(warning => warning.remove());
  
  // Hide badges
  urgent.style.display = 'none';
  okBadge.style.display = 'none';
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
  syncTemperatureInputs('input');
});

// Initialize temperature controls on page load
document.addEventListener('DOMContentLoaded', () => {
  updateSliderScale();
  updateTemperatureStatus();
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
  
  // Clear previous results
  clearPreviousResults();

  try {
    const fd = new FormData();
    fd.append('photo', fileBlob);
    
    // Add comprehensive patient metadata
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
      patientData.temperature_celsius = isCelsius ? temp : ((temp - 32) * 5/9);
      patientData.fever_present = patientData.temperature_celsius >= 38.0;
    }

    // Rash distribution
    if (selectedBodyParts.size > 0) {
      patientData.rash_distribution = Array.from(selectedBodyParts);
    }

    // Medication
    if (medication.value.trim()) {
      patientData.recent_medication = medication.value.trim();
      patientData.antibiotic_use = isAntibiotic.checked;
    }

    // Vaccination status
    patientData.measles_vaccine = measlesVaccine.checked;
    patientData.chickenpox_vaccine = chickenpoxVaccine.checked;

    // General condition
    if (generalCondition.value) {
      patientData.general_condition = generalCondition.value;
    }

    // Symptoms
    const symptoms = [];
    if (soreThroat.checked) symptoms.push('sore_throat');
    if (cough.checked) symptoms.push('cough');
    if (vomiting.checked) symptoms.push('vomiting');
    if (diarrhea.checked) symptoms.push('diarrhea');
    if (shortnessBreath.checked) symptoms.push('shortness_of_breath');
    
    if (symptoms.length > 0) {
      patientData.accompanying_symptoms = symptoms;
    }
    
    // Display input data in the input box
    const inputBox = document.getElementById('input-json');
    if (Object.keys(patientData).length > 0) {
      inputBox.textContent = JSON.stringify(patientData, null, 2);
      fd.append('patient_context', JSON.stringify(patientData));
    } else {
      inputBox.textContent = '{}';
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

    // Show triage level with color coding
    if (data.triage_level) {
      const triageIndicator = document.createElement('div');
      triageIndicator.className = 'triage-indicator';
      triageIndicator.style.marginTop = '8px';
      triageIndicator.style.padding = '8px 12px';
      triageIndicator.style.borderRadius = '6px';
      triageIndicator.style.fontWeight = 'bold';
      triageIndicator.style.textAlign = 'center';
      
      switch(data.triage_level) {
        case 'Green':
          triageIndicator.style.background = 'rgba(34, 197, 94, 0.15)';
          triageIndicator.style.color = '#bbf7d0';
          triageIndicator.innerHTML = '🟢 GREEN - Low Risk';
          break;
        case 'Yellow':
          triageIndicator.style.background = 'rgba(251, 191, 36, 0.15)';
          triageIndicator.style.color = '#fef3c7';
          triageIndicator.innerHTML = '🟡 YELLOW - Moderate Risk';
          break;
        case 'Yellow/Red':
          triageIndicator.style.background = 'rgba(249, 115, 22, 0.15)';
          triageIndicator.style.color = '#fed7aa';
          triageIndicator.innerHTML = '🟠 YELLOW/RED - High Risk';
          break;
        case 'Red':
          triageIndicator.style.background = 'rgba(239, 68, 68, 0.15)';
          triageIndicator.style.color = '#fecaca';
          triageIndicator.innerHTML = '🔴 RED - Emergency Risk';
          break;
      }
      jsonBox.parentNode.insertBefore(triageIndicator, jsonBox.nextSibling);
    }

    // Show image quality warning if present
    if (data.image_quality_warning) {
      const qualityWarning = document.createElement('div');
      qualityWarning.className = 'badge danger quality-warning';
      qualityWarning.style.marginTop = '8px';
      qualityWarning.innerHTML = `⚠️ ${data.image_quality_warning}`;
      jsonBox.parentNode.insertBefore(qualityWarning, jsonBox.nextSibling);
    }

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