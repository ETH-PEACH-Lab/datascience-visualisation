/* eslint-disable @typescript-eslint/quotes */
// colorScheme.ts

// Define the type for a color scheme
type ColorScheme = {
  [key: string]: string;
};

// Create the color scheme mapping
const colorScheme: ColorScheme = {
    "Imports and Environment": "#f28e2b",
    "Data Extraction": "#4e79a7",
    "Data Transform": "#b07aa1",
    "Exploratory Data Analysis": "#edc948",
    "Visualization": "#59a14f",
    "Model Training": "#ff9da7",
    "Model Evaluation": "#9c755f",
    "Data Export": "#e15759",
    // "Model Interpretation": "#bab0ac",
    // "Hyperparam Tuning": "#b07aa1",
    // "Debug": "#76b7b2",
};

export default colorScheme;
  