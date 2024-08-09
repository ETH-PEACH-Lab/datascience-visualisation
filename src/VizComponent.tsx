/* eslint-disable @typescript-eslint/naming-convention */
import * as React from 'react';

interface NotebookCell {
  cell_id: number;
  code: string;
  class: string;
}

interface NotebookCellWithID extends NotebookCell {
  notebook_id: number;
}

interface Notebook {
  notebook_id: number;
  cells: NotebookCell[];
}

export interface VizData {
  notebooks: Notebook[];
}

interface GroupedCellsProps {
  className: string;
  cells: NotebookCellWithID[];
}

const CellComponent: React.FC<{ cell: NotebookCellWithID }> = ({ cell }) => {
  return (
    <div style={{ margin: '5px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <strong>Notebook {cell.notebook_id}, Cell {cell.cell_id}:</strong>
      <pre style={{ margin: '5px 0' }}>{cell.code}</pre>
    </div>
  );
};

const GroupedCells: React.FC<GroupedCellsProps> = ({ className, cells }) => {
  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>Class: {className}</h3>
      {cells.map((cell) => (
        <CellComponent key={`${cell.notebook_id}-${cell.cell_id}`} cell={cell} />
      ))}
    </div>
  );
};

const VizComponent: React.FC<{ data: VizData }> = ({ data }) => {
  if (!data.notebooks || !Array.isArray(data.notebooks)) {
    return <div>No valid notebook data found.</div>;
  }

  // Group cells by their class across all notebooks
  const groupedCells: { [key: string]: NotebookCellWithID[] } = {};

  data.notebooks.forEach((notebook) => {
    notebook.cells.forEach((cell) => {
      const cellWithID: NotebookCellWithID = { ...cell, notebook_id: notebook.notebook_id };
      if (!groupedCells[cell.class]) {
        groupedCells[cell.class] = [];
      }
      groupedCells[cell.class].push(cellWithID);
    });
  });
  console.log(groupedCells);
  return (
    <div style={{ padding: '20px' }}>
      {Object.entries(groupedCells).map(([className, cells]) => (
        <GroupedCells key={className} className={className} cells={cells} />
      ))}
    </div>
  );
};

export const LoadingComponent = () => <div>Loading...</div>;

export const DataNotFoundComponent = () => <div>No data found.</div>;

export default VizComponent;
