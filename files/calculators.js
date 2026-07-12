/* =========================================================
   Calculator Engine — scientifically referenced formulas
   - BMR: Mifflin-St Jeor Equation
   - LBM: Boer Formula
   - Ideal Weight: Devine Formula
   - Protein: ISSN / ACSM ranges by goal + activity
   ========================================================= */

const CONV = {
  lbToKg: lb => lb * 0.453592,
  kgToLb: kg => kg / 0.453592,
  inToCm: inch => inch * 2.54,
  cmToIn: cm => cm / 2.54,
  ftInToCm: (ft, inch) => (ft * 12 + Number(inch || 0)) * 2.54,
};

function round1(n){ return Math.round(n * 10) / 10; }
function round0(n){ return Math.round(n); }

/* ---------- Activity multipliers (TDEE) ---------- */
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9
};

/* ---------- BMR: Mifflin-St Jeor ---------- */
function calcBMR({ gender, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

/* ---------- TDEE ---------- */
function calcTDEE(bmr, activity) {
  return bmr * (ACTIVITY_FACTORS[activity] || 1.2);
}

/* ---------- Lean Body Mass: Boer Formula ---------- */
function calcLBM({ gender, weightKg, heightCm }) {
  return gender === 'male'
    ? 0.407 * weightKg + 0.267 * heightCm - 19.2
    : 0.252 * weightKg + 0.473 * heightCm - 48.3;
}

/* ---------- Ideal Weight: Devine Formula ---------- */
function calcIdealWeight({ gender, heightCm }) {
  const heightIn = CONV.cmToIn(heightCm);
  const overFive = Math.max(heightIn - 60, 0);
  const base = gender === 'male' ? 50 : 45.5;
  return base + 2.3 * overFive;
}

/* ---------- BMI ---------- */
function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}
function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'var(--blue-500)' };
  if (bmi < 25) return { label: 'Healthy range', color: 'var(--green-500)' };
  if (bmi < 30) return { label: 'Overweight', color: '#E0A62E' };
  return { label: 'Obesity range', color: '#D9603B' };
}

/* ---------- Water Intake ---------- */
function calcWater({ weightKg, activity }) {
  const base = weightKg * 0.033; // liters
  const bonus = { sedentary: 0, light: 0.3, moderate: 0.5, active: 0.7, athlete: 1.0 }[activity] || 0;
  return base + bonus;
}

/* ---------- Protein: goal + activity based g/kg range (ISSN/ACSM referenced) ---------- */
function proteinPerKgRange(goal, activity) {
  // returns [low, high] g per kg bodyweight
  const table = {
    weight_loss:      { sedentary:[1.6,2.0], light:[1.8,2.2], moderate:[1.8,2.4], active:[2.0,2.4], athlete:[2.0,2.6] },
    maintenance:      { sedentary:[0.8,1.2], light:[1.0,1.4], moderate:[1.2,1.6], active:[1.4,1.8], athlete:[1.6,2.0] },
    muscle_gain:      { sedentary:[1.4,1.8], light:[1.6,2.0], moderate:[1.6,2.2], active:[1.8,2.4], athlete:[2.0,2.6] },
    recomposition:    { sedentary:[1.6,2.0], light:[1.8,2.2], moderate:[1.8,2.4], active:[2.0,2.6], athlete:[2.2,2.8] },
  };
  const g = table[goal] || table.maintenance;
  return g[activity] || g.moderate;
}

function calcProtein({ weightKg, goal, activity, mealsPerDay }) {
  const [low, high] = proteinPerKgRange(goal, activity);
  const mid = (low + high) / 2;
  const gramsLow = weightKg * low;
  const gramsHigh = weightKg * high;
  const gramsMid = weightKg * mid;
  const perMeal = gramsMid / (mealsPerDay || 4);
  return {
    gramsLow: round0(gramsLow),
    gramsHigh: round0(gramsHigh),
    gramsMid: round0(gramsMid),
    perKg: round1(mid),
    perMeal: round0(perMeal)
  };
}

/* ---------- Ring renderer (used by protein + other gauges) ---------- */
function renderRing(el, value, max, colorVar) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const offset = c - pct * c;
  el.innerHTML = `
    <svg width="104" height="104" viewBox="0 0 104 104">
      <circle class="ring-track" cx="52" cy="52" r="${r}"></circle>
      <circle class="ring-fill" cx="52" cy="52" r="${r}"
        style="stroke:${colorVar || 'var(--green-500)'}; stroke-dasharray:${c}; stroke-dashoffset:${c};"></circle>
    </svg>`;
  requestAnimationFrame(() => {
    const fillEl = el.querySelector('.ring-fill');
    if (fillEl) fillEl.style.strokeDashoffset = String(offset);
  });
}
