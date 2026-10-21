// Concrete strength prediction models (Ridge, Lasso, Elastic Net)
// Feature order (8): Cement, Slag, FlyAsh, Water, Superplasticizer, CoarseAggregate, FineAggregate, Age

const MODEL_FEATURE_ORDER = [
  "Cement",
  "Slag",
  "FlyAsh",
  "Water",
  "Superplasticizer",
  "CoarseAggregate",
  "FineAggregate",
  "Age",
];

// StandardScaler parameters fitted on the 80% training split
const SCALER_MEAN = [
  283.358471, 74.371177, 53.159648, 181.796408, 6.162243, 973.548155,
  772.105789, 44.661408,
];
const SCALER_SCALE = [
  107.472046, 86.924748, 63.961326, 21.310468, 5.963433, 78.646763, 80.934998,
  60.438994,
];

const MODELS = {
  ridge: {
    name: "Ridge (L2)",
    coef: [
      12.559741, 9.213632, 5.061598, -3.038873, 1.84278, 1.248667, 1.751912,
      7.018837,
    ],
    intercept: 35.857718,
  },
  lasso: {
    name: "Lasso (L1)",
    coef: [
      7.576345, 4.18344, 0.0, -2.896103, 3.225725, -0.0, -0.04689, 5.40283,
    ],
    intercept: 35.857718,
  },
  elasticNet: {
    name: "Elastic Net",
    coef: [
      4.809388, 2.102898, -0.238579, -2.765381, 2.643742, -0.932028, -1.294636,
      3.801186,
    ],
    intercept: 35.857718,
  },
};

/**
 * Build the raw 8-feature vector from UI inputs.
 * UI uses: cement (50kg bags), water (L), sand (kg), gravel (kg), age (days)
 * Missing features (Slag, FlyAsh, Superplasticizer) use dataset baselines.
 */
function buildFeatureVector(
  bagsCement,
  litersWater,
  kgSand,
  kgGravel,
  curingDays,
) {
  const kgCement = bagsCement * 50.0;
  return [
    kgCement, // Cement
    0.0, // Slag (baseline)
    0.0, // FlyAsh (baseline)
    litersWater, // Water
    0.0, // Superplasticizer (baseline)
    kgGravel, // CoarseAggregate
    kgSand, // FineAggregate
    curingDays, // Age
  ];
}

function standardize(raw) {
  return raw.map((v, i) => (v - SCALER_MEAN[i]) / SCALER_SCALE[i]);
}

function predict(modelKey, rawVector) {
  const model = MODELS[modelKey];
  const scaled = standardize(rawVector);
  let sum = model.intercept;
  for (let i = 0; i < scaled.length; i++) {
    sum += model.coef[i] * scaled[i];
  }
  return Math.max(0.0, sum);
}

/**
 * Run all three models on a UI mix and return { ridge, lasso, elasticNet } in MPa.
 */
function predictAll(bagsCement, litersWater, kgSand, kgGravel, curingDays) {
  const raw = buildFeatureVector(
    bagsCement,
    litersWater,
    kgSand,
    kgGravel,
    curingDays,
  );
  return {
    ridge: predict("ridge", raw),
    lasso: predict("lasso", raw),
    elasticNet: predict("elasticNet", raw),
  };
}
