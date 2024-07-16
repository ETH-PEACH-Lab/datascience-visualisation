import React from 'react';
import { GraphCanvas } from 'reagraph';

const nodes = [
  { id: '1', label: 'Data Extraction' },
  { id: '2', label: 'Data Transform' },
  { id: '3', label: 'Visualization' },
  { id: '4', label: 'Debug' },
  { id: '5', label: 'Model Training' }
];

const edges = [
  { id: '1', source: '1', target: '2' },
  { id: '2', source: '1', target: '3' },
  { id: '3', source: '1', target: '4' },
  { id: '4', source: '2', target: '3' },
  { id: '5', source: '3', target: '4' },
  { id: '6', source: '3', target: '5' },
  { id: '7', source: '4', target: '5' }
];

const GraphCanvasComponent: React.FC = () => (
  <GraphCanvas nodes={nodes} edges={edges} />
);

export default GraphCanvasComponent;
