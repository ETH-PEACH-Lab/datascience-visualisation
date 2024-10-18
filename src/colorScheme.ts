// Defines a color scheme where specific stages are mapped to a corresponding color
type ColorScheme = {
  [key: string]: string;
};

// Color scheme for different stages in data workflows
const colorScheme: ColorScheme = {
  "Imports and Environment": "#f28e2b",
  "Data Extraction": "#4e79a7",
  "Data Transform": "#b07aa1",
  "Exploratory Data Analysis": "#edc948",
  "Visualization": "#59a14f",
  "Model Training": "#ff9da7",
  "Model Evaluation": "#9c755f",
  "Data Export": "#e15759",
};

export default colorScheme;