import React, { useEffect, useRef, useState } from 'react';
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
  notebook_name: string;
}

export interface Notebook {
  notebook_id: number;
  cells: NotebookCell[];
}
export interface NotebookWithCellId {
  notebook_id: number;
  cells: NotebookCellWithID[];
  notebook_name: string;
}

export interface VizData {
  notebooks: NotebookWithCellId[];
}

interface GroupedCellsProps {
  className: string;
  cells: NotebookCellWithID[];
  onSelectNotebook: (notebookIds: [number]) => void;
  selectedClusters: string[];
  setSelectedClusters: (clusters: string[]) => void;
  scrolledClass: string;
}

const GroupedCells: React.FC<GroupedCellsProps> = ({ className, cells, onSelectNotebook, selectedClusters, setSelectedClusters, scrolledClass }) => {
  const [isOpen, setIsOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null); // Add ref here

  const toggleOpen = () => setIsOpen(!isOpen);
  
  useEffect(() => {
    if(scrolledClass === className && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrolledClass]);

  // Group cells by their cluster
  const clusters = cells.reduce((acc, cell) => {
    if (!acc[cell.cluster]) {
      acc[cell.cluster] = [];
    }
    acc[cell.cluster].push(cell); 
    return acc;
  }, {} as { [key: string]: NotebookCellWithID[] });

  const totalCells = cells.length; // Total number of cells within the class

  const selectedCells = (clusterNames: string[]) => {
    return clusterNames.filter(c => c in clusters).flatMap((clusterName) =>
      clusters[clusterName].map(cell => ({ clusterName, cell }))
    ).sort((a, b) => {
      if (a.cell.notebook_id === b.cell.notebook_id) {
        return a.cell.cell_id - b.cell.cell_id;
      }
      return a.cell.notebook_id - b.cell.notebook_id;
    });
  };

  const handleClusterClick = (clusterName: string) => {
    if(selectedClusters.includes(clusterName)) {
      setSelectedClusters(selectedClusters.filter(cluster => cluster !== clusterName));
    }
    else {
      setSelectedClusters([...selectedClusters, clusterName]);
    }
  };

  const handleIdentifierClick = (clusterIdentifier: string) => {
    const cluster = clusterIdentifiers.find(ci => ci.identifier === clusterIdentifier);
    if (cluster) {
      setSelectedClusters([cluster.name as string]);
    }
  };

  // Generate identifiers (A, B, C, etc.) for each cluster
  const clusterIdentifiers = Object.keys(clusters).map((clusterName, index) => ({
    name: clusterName,
    identifier: String.fromCharCode(65 + index) // Convert index to ASCII A, B, C, etc.
  }));

  return (
    <div 
      className="group-container" 
      style={{ borderColor: colorScheme[className] }}
      ref={containerRef}
    >
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
                className={`cluster-button ${selectedClusters.includes(name) ? 'active' : ''}`}
                onClick={() => handleClusterClick(name)}
              >
                <span className="cluster-identifier">{identifier}</span> {/* Identifier (A, B, C) */}
                {name} ({clusters[name].length}/{totalCells}) {/* Show the number of cells in this cluster */}
              </button>
            ))}
          </div>
          <div className="cluster-cells-container">
            {selectedCells(selectedClusters)?.map((cell) => (
                <div
                  key={`${cell.cell.notebook_id}-${cell.cell.cell_id}`}
                  className="cell-container"
                  style={{ borderColor: colorScheme[className] }}
                >
                  <CodeCell
                    code={cell.cell.code}
                    clusterLabel={clusterIdentifiers.find(c => c.name === cell.clusterName)?.identifier || ''}
                    notebook_id={cell.cell.notebook_id} // Pass the notebook ID
                    onSelectNotebook={onSelectNotebook} // Pass the function to CodeCell
                    setCurrentCluster={handleIdentifierClick}
                    notebook_name={cell.cell.notebook_name}
                  />
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

interface VizComponentProps {
  data: VizData;
  onSelectNotebook: (notebookIds: [number]) => void;
  selectedClusters: string[];
  setSelectedClusters: (clusters: string[]) => void;
  scrolledClass: string;
}

const VizComponent: React.FC<VizComponentProps> = ({data, onSelectNotebook, selectedClusters, setSelectedClusters, scrolledClass}) => {

  if (!data.notebooks || !Array.isArray(data.notebooks)) {
    return <div>No valid notebook data found.</div>;
  }

  let newNotebook: NotebookWithCellId = { notebook_id: -2, cells: [], notebook_name: 'Unassigned' };

  // Group cells by their class across all notebooks
  const groupedCells: { [key: string]: NotebookCellWithID[] } = {};

  data.notebooks.forEach((notebook) => {
    notebook.cells.forEach((cell) => {
      if (notebook.notebook_id !== -2) {
        const cellWithID: NotebookCellWithID = { ...cell, notebook_id: notebook.notebook_id, notebook_name: notebook.notebook_name };
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
          selectedClusters={selectedClusters}
          setSelectedClusters={setSelectedClusters}
          scrolledClass={scrolledClass}
        />
      ))}
    </div>
  );
};


export const LoadingComponent = () => <div>Loading...</div>;

export const DataNotFoundComponent = () => <div>No data found.</div>;

export default VizComponent;
