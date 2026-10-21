const fields = [
  { sliderId: "cement", numId: "cement-num" },
  { sliderId: "water", numId: "water-num" },
  { sliderId: "sand", numId: "sand-num" },
  { sliderId: "gravel", numId: "gravel-num" },
  { sliderId: "age", numId: "age-num" },
];

const costBagInput = document.getElementById("cost-bag");
const btnCalculate = document.getElementById("calculate-btn");
const btnReset = document.getElementById("reset-btn");
const drawerTrigger = document.getElementById("drawer-trigger");
const drawerBody = document.getElementById("drawer-body");
const chevron = document.getElementById("chevron");

const STORAGE_KEY = "cementwise_state_v1";

function saveState() {
  const state = {
    theme: document.documentElement.getAttribute("data-theme") || "",
    cement: document.getElementById("cement-num").value,
    water: document.getElementById("water-num").value,
    sand: document.getElementById("sand-num").value,
    gravel: document.getElementById("gravel-num").value,
    age: document.getElementById("age-num").value,
    cost: costBagInput.value,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // storage unavailable - ignore
  }
}

function restoreState() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    saved = null;
  }
  if (!saved) return false;

  let restored = false;
  if (saved.theme !== undefined) {
    document.documentElement.setAttribute("data-theme", saved.theme);
    restored = true;
  }
  if (saved.cement !== undefined)
    document.getElementById("cement-num").value = saved.cement;
  if (saved.water !== undefined)
    document.getElementById("water-num").value = saved.water;
  if (saved.sand !== undefined)
    document.getElementById("sand-num").value = saved.sand;
  if (saved.gravel !== undefined)
    document.getElementById("gravel-num").value = saved.gravel;
  if (saved.age !== undefined)
    document.getElementById("age-num").value = saved.age;
  if (saved.cost !== undefined) costBagInput.value = saved.cost;

  ["cement", "water", "sand", "gravel", "age"].forEach((key) => {
    const slider = document.getElementById(key);
    const numInput = document.getElementById(`${key}-num`);
    if (slider && numInput) slider.value = numInput.value;
  });
  return restored;
}

fields.forEach((pair) => {
  const slider = document.getElementById(pair.sliderId);
  const numInput = document.getElementById(pair.numId);

  slider.addEventListener("input", (e) => {
    numInput.value = e.target.value;
    numInput.setCustomValidity("");
    saveState();
  });

  numInput.addEventListener("change", () => {
    syncNumberInput(numInput, slider);
    saveState();
  });
});

costBagInput.addEventListener("input", () => {
  costBagInput.setCustomValidity("");
  saveState();
});

costBagInput.addEventListener("change", () => {
  costBagInput.setCustomValidity("");
  saveState();
});

function clampToRange(val, min, max, step) {
  if (isNaN(val)) return { value: min, valid: false, reason: "non-numeric" };
  if (val < min)
    return { value: min, valid: false, reason: `below minimum (${min})` };
  if (val > max)
    return { value: max, valid: false, reason: `above maximum (${max})` };
  const snapped = Math.round((val - min) / step) * step + min;
  return { value: parseFloat(snapped.toFixed(10)), valid: true, reason: "" };
}

function syncNumberInput(numInput, slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const step = parseFloat(slider.step);
  const raw = parseFloat(numInput.value);

  if (isNaN(raw)) {
    numInput.value = min;
    slider.value = min;
    numInput.setCustomValidity("Value must be a number; reset to minimum.");
    return;
  }

  const result = clampToRange(raw, min, max, step);
  numInput.value = result.value;
  slider.value = result.value;

  if (result.valid) {
    numInput.setCustomValidity("");
  } else {
    numInput.setCustomValidity(
      `Input rejected: ${result.reason}. Clamped to ${result.value}.`,
    );
  }
}

function runPipelineEngine() {
  const cementBags =
    parseFloat(document.getElementById("cement-num").value) || 0;
  const waterLiters =
    parseFloat(document.getElementById("water-num").value) || 0;
  const sandKg = parseFloat(document.getElementById("sand-num").value) || 0;
  const gravelKg = parseFloat(document.getElementById("gravel-num").value) || 0;
  const ageDays = parseInt(document.getElementById("age-num").value, 10) || 0;
  const costPerBag = parseFloat(costBagInput.value) || 0;

  const cementCost = cementBags * costPerBag;
  const sandCost = sandKg * 1.0;
  const gravelCost = gravelKg * 1.0;
  const waterCost = waterLiters * 0.25;
  const finalTotalCost = cementCost + sandCost + gravelCost + waterCost;

  document.getElementById("total-cost-display").innerText =
    `KES ${finalTotalCost.toLocaleString()}`;
  document.getElementById("label-cement-breakdown").innerText =
    `Cement (${cementBags} bags)`;
  document.getElementById("val-cement-breakdown").innerText =
    cementCost.toLocaleString();
  document.getElementById("val-sand-breakdown").innerText =
    sandCost.toLocaleString();
  document.getElementById("val-gravel-breakdown").innerText =
    gravelCost.toLocaleString();
  document.getElementById("val-water-breakdown").innerText =
    waterCost.toLocaleString();
  document.getElementById("val-total-breakdown").innerText =
    finalTotalCost.toLocaleString();

  const badge = document.getElementById("strength-badge");
  const gradeDisplay = document.getElementById("grade-display");
  const suitabilityList = document.getElementById("suitability-list");

  // Degenerate / incomplete mix: show a neutral state instead of a bogus extrapolation
  if (cementBags === 0 || waterLiters === 0 || ageDays === 0) {
    document.getElementById("strength-display").innerText = "--- MPa";
    badge.innerText = "Enter a mix to estimate";
    badge.className = "status-badge is-hint";
    gradeDisplay.innerText = "-";
    suitabilityList.innerHTML =
      "<li>Enter a mix and calculate to see suitability</li>";
    document.getElementById("lasso-status").innerText =
      "Lasso predicts: ---- MPa";
    document.getElementById("ridge-status").innerText =
      "Ridge predicts: ---- MPa";
    document.getElementById("elastic-status").innerText = "Result: ---- MPa";
    document.getElementById("lasso-desc").innerText =
      "Fill in the mix and click Calculate to see model predictions.";
    document.getElementById("ridge-desc").innerText =
      "Fill in the mix and click Calculate to see model predictions.";
    document.getElementById("elastic-desc").innerText =
      "Fill in the mix and click Calculate to see model predictions.";
    return;
  }

  // Predictions from the trained Ridge, Lasso, and Elastic Net models
  const predictions = predictAll(
    cementBags,
    waterLiters,
    sandKg,
    gravelKg,
    ageDays,
  );
  const ridgeMpa = predictions.ridge;
  const lassoMpa = predictions.lasso;
  const elasticMpa = predictions.elasticNet;

  document.getElementById("strength-display").innerText =
    `${elasticMpa.toFixed(1)} MPa`;

  if (elasticMpa < 20.0) {
    badge.innerText = "Low Strength";
    badge.className = "status-badge";
    badge.style.backgroundColor = "#fff5f5";
    badge.style.color = "#c53030";
    gradeDisplay.innerText = "Grade c15/c20";
    suitabilityList.innerHTML =
      "<li>Blinding foundation layers</li><li>Non-structural boundary frames</li><li>Pedestrian walkway layers</li>";
  } else if (elasticMpa <= 35.0) {
    badge.innerText = "Good Strength";
    badge.className = "status-badge positive";
    badge.style.backgroundColor = "";
    badge.style.color = "";
    gradeDisplay.innerText = "Grade c30/c35";
    suitabilityList.innerHTML =
      "<li>Residential buildings</li><li>Commercial structures</li><li>Roads and infrastructure</li><li>General construction</li>";
  } else {
    badge.innerText = "High Strength";
    badge.className = "status-badge";
    badge.style.backgroundColor = "#e6f6ee";
    badge.style.color = "#258c58";
    gradeDisplay.innerText = "Grade c40/c50";
    suitabilityList.innerHTML =
      "<li>Pre-stressed roof beams</li><li>Heavy industrial equipment beds</li><li>Structural bridge components</li>";
  }

  // Model insight cards show each model's own prediction + dynamic advice
  const lassoDesc =
    lassoMpa < elasticMpa
      ? `Lasso predicts ${lassoMpa.toFixed(1)} MPa. Its L1 penalty zeroed out redundant features, so a leaner, cheaper mix is possible.`
      : `Lasso predicts ${lassoMpa.toFixed(1)} MPa. Every ingredient contributes; removing any would lower strength.`;
  const ridgeDesc =
    ridgeMpa < elasticMpa
      ? `Ridge predicts ${ridgeMpa.toFixed(1)} MPa. Its L2 shrinkage shows correlated ingredients (water/cement) are pulling the prediction down.`
      : `Ridge predicts ${ridgeMpa.toFixed(1)} MPa. The mix is stable and Ridge confirms no wild swings from ingredient interactions.`;

  document.getElementById("lasso-status").innerText =
    `Lasso predicts: ${lassoMpa.toFixed(1)} MPa`;
  document.getElementById("ridge-status").innerText =
    `Ridge predicts: ${ridgeMpa.toFixed(1)} MPa`;
  document.getElementById("elastic-status").innerText =
    `Result: ${elasticMpa.toFixed(1)} MPa with high confidence`;

  document.getElementById("lasso-desc").innerText = lassoDesc;
  document.getElementById("ridge-desc").innerText = ridgeDesc;
  document.getElementById("elastic-desc").innerText =
    `Elastic Net predicts ${elasticMpa.toFixed(1)} MPa: the hybrid of L1 and L2, our most reliable estimate for this mix.`;
}

drawerTrigger.addEventListener("click", () => {
  const isOpen = drawerBody.classList.toggle("open");
  chevron.classList.toggle("open", isOpen);
});

const hamburgerToggle = document.getElementById("hamburger-toggle");
const navLinks = document.querySelector(".nav-links");

hamburgerToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

btnCalculate.addEventListener("click", () => {
  let allValid = true;
  fields.forEach((pair) => {
    const numInput = document.getElementById(pair.numId);
    const slider = document.getElementById(pair.sliderId);
    syncNumberInput(numInput, slider);
    if (numInput.validity.customError) allValid = false;
  });

  const costRaw = parseFloat(costBagInput.value);
  if (isNaN(costRaw) || costRaw < 0) {
    costBagInput.value = 800;
    costBagInput.setCustomValidity(
      "Cost must be a positive number; reset to default.",
    );
    allValid = false;
  } else {
    costBagInput.setCustomValidity("");
  }

  if (allValid) {
    runPipelineEngine();
  }
});

const standardMixBtn = document.getElementById("standard-mix-btn");

// Standard mix values derived from the dataset averages:
//   Cement 281.2 kg/m3  -> ~5.6 bags of 50kg
//   Water  181.6 L/m3
//   Fine aggregate (sand) 773.6 kg/m3
//   Coarse aggregate (gravel) 972.9 kg/m3
//   Curing age 28 days (standard design strength age)
const standardMix = {
  cement: 5.5,
  water: 180,
  sand: 775,
  gravel: 975,
  age: 28,
};

function setStandardMix() {
  const targets = {
    cement: standardMix.cement,
    water: standardMix.water,
    sand: standardMix.sand,
    gravel: standardMix.gravel,
    age: standardMix.age,
  };
  const keys = Object.keys(targets);
  const duration = 700; // ms per slider
  const stagger = 120; // ms delay between sliders

  keys.forEach((key, i) => {
    const slider = document.getElementById(key);
    const numInput = document.getElementById(`${key}-num`);
    const start = parseFloat(slider.value);
    const target = targets[key];
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const step = parseFloat(slider.step);

    let clampedTarget = Math.max(min, Math.min(max, target));
    clampedTarget = Math.round((clampedTarget - min) / step) * step + min;
    clampedTarget = parseFloat(clampedTarget.toFixed(10));

    const delay = i * stagger;
    const t0 = performance.now() + delay;

    function tick(now) {
      if (now < t0) {
        requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - t0;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const value = start + (clampedTarget - start) * eased;
      slider.value = value;
      numInput.value = value.toFixed(1);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        slider.value = clampedTarget;
        numInput.value = clampedTarget;
      }
    }
    requestAnimationFrame(tick);
  });

  // Recompute results once the last slider finishes
  setTimeout(runPipelineEngine, (keys.length - 1) * stagger + duration);
}

standardMixBtn.addEventListener("click", setStandardMix);

btnReset.addEventListener("click", () => {
  document.getElementById("cement").value = 0;
  document.getElementById("cement-num").value = 0;
  document.getElementById("water").value = 0;
  document.getElementById("water-num").value = 0;
  document.getElementById("sand").value = 0;
  document.getElementById("sand-num").value = 0;
  document.getElementById("gravel").value = 0;
  document.getElementById("gravel-num").value = 0;
  document.getElementById("age").value = 0;
  document.getElementById("age-num").value = 0;
  costBagInput.value = 0;
  saveState();
  runPipelineEngine();
});

const darkModeToggle = document.getElementById("dark-mode-toggle");

darkModeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "" : "dark");
  darkModeToggle.setAttribute("aria-pressed", String(!isDark));
  saveState();
});

// Restore persisted state (theme + inputs) on load, then compute.
restoreState();
runPipelineEngine();
