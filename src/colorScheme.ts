/* eslint-disable @typescript-eslint/quotes */
// colorScheme.ts

// Define the type for a color scheme
type ColorScheme = {
  [key: string]: string;
};

// Create the color scheme mapping
const colorScheme: ColorScheme = {
    "Data_Extraction": "#4e79a7",  // Example class names, replace with actual class names
    "Data_Transform" : "#f28e2b",
    "Visualization": "#59a14f",
    "Model_Evaluation": "#9c755f",
    "Environment": "#f28e2b",
    "Exploratory_Data_Analysis": "#edc948",
    "Model_Interpretation": "#bab0ac",
    "Data_Export": "#e15759",
    "Hyperparam_Tuning": "#b07aa1",
    "Debug": "#76b7b2",
    "Model_Train": "#ff9da7"
};

export default colorScheme;
