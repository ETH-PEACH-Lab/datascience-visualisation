import React, { useState } from 'react';
import colorScheme from './colorScheme';
import '../style/VizComponent.css';
import CodeCell from './CodeCell';

interface NotebookCell {
  cell_id: number;
  code: string;
  class: string;
  cluster: string;
  originalNotebookId: number;
}

export interface NotebookCellWithID extends NotebookCell {
  notebook_id: number;
}

export interface Notebook {
  notebook_id: number;
  cells: NotebookCell[];
}
export interface NotebookWithCellId {
  notebook_id: number;
  cells: NotebookCellWithID[];
}

export interface VizData {
  notebooks: NotebookWithCellId[];
}

interface GroupedCellsProps {
  className: string;
  cells: NotebookCellWithID[];
  onSelectNotebook: (notebookIds: [number]) => void;
}

const GroupedCells: React.FC<GroupedCellsProps> = ({ className, cells, onSelectNotebook }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [openClusters, setOpenClusters] = useState<string[]>([]); // Manage multiple open clusters

  const toggleOpen = () => setIsOpen(!isOpen);

  // Group cells by their cluster
  const clusters = cells.reduce((acc, cell) => {
    if (!acc[cell.cluster]) {
      acc[cell.cluster] = [];
    }
    acc[cell.cluster].push(cell);
    return acc;
  }, {} as { [key: string]: NotebookCellWithID[] });

  const totalCells = cells.length; // Total number of cells within the class

  // Filter openClusters to remove clusters that no longer exist
  // useEffect(() => {
  //   setOpenClusters((prev) => prev.filter(clusterName => clusters[clusterName] && clusters[clusterName].length > 0));
  // }, [clusters]);

  const handleClusterClick = (clusterName: string) => {
    setOpenClusters((prev) =>
      prev.includes(clusterName) ? prev.filter((name) => name !== clusterName) : [...prev, clusterName]
    );
  };

  // Generate identifiers (A, B, C, etc.) for each cluster
  const clusterIdentifiers = Object.keys(clusters).map((clusterName, index) => ({
    name: clusterName,
    identifier: String.fromCharCode(65 + index) // Convert index to ASCII A, B, C, etc.
  }));

  return (
    <div className="group-container" style={{ borderColor: colorScheme[className] }}>
      <div
        className="group-header"
        style={{ backgroundColor: colorScheme[className] || '#ddd' }}
        onClick={toggleOpen}
      >
        <span>{className}</span>
        <span className={`group-header-arrow ${isOpen ? 'group-header-arrow-open' : ''}`}>
          {'>'}
        </span>
      </div>
      {isOpen && (
        <div className="group-content">
          <div className="clusters-container">
            {clusterIdentifiers.map(({ name, identifier }) => (
              <button
                key={name}
                className={`cluster-button ${openClusters.includes(name) ? 'active' : ''}`}
                onClick={() => handleClusterClick(name)}
              >
                <span className="cluster-identifier">{identifier}</span> {/* Identifier (A, B, C) */}
                {name} ({clusters[name].length}/{totalCells}) {/* Show the number of cells in this cluster */}
              </button>
            ))}
          </div>
          <div className="cluster-cells-container">
            {openClusters.map((clusterName) =>
              clusters[clusterName]?.map((cell) => (
                <div
                  key={`${cell.notebook_id}-${cell.cell_id}`}
                  className="cell-container"
                  style={{ borderColor: colorScheme[className] }}
                >
                  <CodeCell
                    code={cell.code}
                    clusterLabel={clusterIdentifiers.find(c => c.name === clusterName)?.identifier || ''}
                    notebook_id={cell.notebook_id} // Pass the notebook ID
                    onSelectNotebook={onSelectNotebook} // Pass the function to CodeCell
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const VizComponent: React.FC<{ data: VizData; onSelectNotebook: (notebookIds: [number]) => void }> = ({ data, onSelectNotebook }) => {
  if (!data.notebooks || !Array.isArray(data.notebooks)) {
    return <div>No valid notebook data found.</div>;
  }

  let newNotebook: NotebookWithCellId = { notebook_id: -2, cells: [] };

  // Group cells by their class across all notebooks
  const groupedCells: { [key: string]: NotebookCellWithID[] } = {};

  data.notebooks.forEach((notebook) => {
    notebook.cells.forEach((cell) => {
      if (notebook.notebook_id !== -2) {
        const cellWithID: NotebookCellWithID = { ...cell, notebook_id: notebook.notebook_id };
        newNotebook.cells.push(cellWithID);
        if (!groupedCells[cell.class]) {
          groupedCells[cell.class] = [];
        }
        groupedCells[cell.class].push(cellWithID);
      } else {
        if (!groupedCells[cell.class]) {
          groupedCells[cell.class] = [];
        }
        cell.notebook_id = cell.originalNotebookId;
        groupedCells[cell.class].push(cell);
      }
    });
  });

  return (
    <div style={{ padding: '20px' }}>
      {Object.entries(groupedCells).map(([className, cells]) => (
        <GroupedCells 
          key={className} 
          className={className} 
          cells={cells} 
          onSelectNotebook={onSelectNotebook}
        />
      ))}
    </div>
  );
};

export const LoadingComponent = () => <div>Loading...</div>;

export const DataNotFoundComponent = () => <div>No data found.</div>;

export default VizComponent;
