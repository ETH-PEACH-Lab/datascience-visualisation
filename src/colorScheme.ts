/* eslint-disable @typescript-eslint/quotes */
// colorScheme.ts

// Define the type for a color scheme
type ColorScheme = {
  [key: string]: string;
};

// Create the color scheme mapping
const colorScheme: ColorScheme = {
    "Data Extraction": "#4e79a7",  // Example class names, replace with actual class names
    "Visualization": "#59a14f",
    "Model Evaluation": "#9c755f",
    "Imports and Environment": "#f28e2b",
    "Exploratory Data Analysis": "#edc948",
    // "Model Interpretation": "#bab0ac",
    "Data Export": "#e15759",
    // "Hyperparam Tuning": "#b07aa1",
    // "Debug": "#76b7b2",
    "Model Training": "#ff9da7",
    "Data Transform": "#b07aa1",
};

export default colorScheme;
  