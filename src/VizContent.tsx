import {
  ReactWidget
} from '@jupyterlab/apputils';

import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import * as React from 'react';
import VizComponent, { LoadingComponent, DataNotFoundComponent, VizData, NotebookCellWithID, NotebookWithCellId } from './VizComponent';
import NotebookSelector from './NotebookSelector';
import { FlowchartWidget } from './Flowchart';
import { useCallback, useEffect, useState } from 'react';

interface VizContentProps {
  context: DocumentRegistry.Context;
  flowchartWidget: FlowchartWidget;
}

const VizContent: React.FC<VizContentProps> = ({ context, flowchartWidget }) => {
  const [selectedNotebookIds, setSelectedNotebookIds] = useState<number[]>([-2]);
  const [isReady, setIsReady] = useState<boolean>(context.isReady);

  useEffect(() => {
    if (!context.isReady) {
      context.ready.then(() => {
        setIsReady(true);
      });
    } else {
      setIsReady(true);
    }
  }, [context]);

  // Function to handle notebook selection
  const handleNotebookSelection = useCallback((selectedIds: number[]) => {
    setSelectedNotebookIds([...selectedIds]);
    console.log("Selected notebooks", selectedIds);
  }, []);

  // Function to update the flowchart widget when notebooks are selected
  useEffect(() => {
    if (isReady) {
      const content = context.model.toString();

      let jsonData: VizData = { notebooks: [] };
      let data: any = {};

      if (content.trim() !== "") {
        try {
          jsonData = JSON.parse(content);
          data = JSON.parse(content);
        } catch (error) {
          console.error("Error parsing JSON", error);
          return;
        }

        let newNotebook: NotebookWithCellId = { notebook_id: -2, cells: [] };

        jsonData.notebooks.forEach(notebook => {
          notebook.cells.forEach(cell => {
            const classMetadata = data["metadata"]["clusters"][cell.class]["titles"];

            if (classMetadata && classMetadata[cell.cluster]) {
              cell.cluster = classMetadata[cell.cluster]; // Replace cluster ID with the title
            }
            const cellWithNotebookId = {
              ...cell,
              originalNotebookId: notebook.notebook_id // Add a new property to store the original notebook ID
            };
            newNotebook.cells.push(cellWithNotebookId);
          });
        });
        jsonData.notebooks.push(newNotebook);

        const selectedCells: NotebookCellWithID[] = jsonData.notebooks
          .filter(notebook => selectedNotebookIds.includes(notebook.notebook_id))
          .flatMap(notebook =>
            notebook.cells.map(cell => ({
              ...cell,
              notebook_id: notebook.notebook_id,  // Add notebook_id to each cell
            }))
          );

        flowchartWidget.updateGraph(selectedCells);
      }
    }
  }, [isReady, selectedNotebookIds, context, flowchartWidget]);

  if (!isReady) {
    return <LoadingComponent />;
  }

  const content = context.model.toString();
  let jsonData: VizData = { notebooks: [] };
  let data: any = {};

  if (content.trim() === "") {
    return <DataNotFoundComponent />;
  }

  try {
    jsonData = JSON.parse(content);
    data = JSON.parse(content);
  } catch (error) {
    console.error("Error parsing JSON", error);
  }

  jsonData.notebooks.forEach(notebook => {
    notebook.cells.forEach(cell => {
      const classMetadata = data["metadata"]["clusters"][cell.class]["titles"];

      if (classMetadata && classMetadata[cell.cluster]) {
        cell.cluster = classMetadata[cell.cluster]; // Replace cluster ID with the title
      }
    });
  });

  let newNotebook: NotebookWithCellId = { notebook_id: -2, cells: [] };

  jsonData.notebooks.forEach(notebook => {
    notebook.cells.forEach(cell => {
      const classMetadata = data["metadata"]["clusters"][cell.class]["titles"];

      if (classMetadata && classMetadata[cell.cluster]) {
        cell.cluster = classMetadata[cell.cluster]; // Replace cluster ID with the title
      }
      const cellWithNotebookId = {
        ...cell,
        originalNotebookId: notebook.notebook_id // Add a new property to store the original notebook ID
      };
      newNotebook.cells.push(cellWithNotebookId);
    });
  });
  jsonData.notebooks.push(newNotebook);

  const selectedNotebooks = jsonData.notebooks.filter(notebook =>
    selectedNotebookIds.includes(notebook.notebook_id)
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <NotebookSelector
        notebookIds={jsonData.notebooks.map(notebook => notebook.notebook_id)}
        selectedNotebooks={selectedNotebookIds}
        onSelectionChange={handleNotebookSelection}
      />
      <VizComponent
        data={{ notebooks: selectedNotebooks }}
        onSelectNotebook={handleNotebookSelection}
      />
    </div>
  );
};

class VizContentWidget extends ReactWidget {
  private context: DocumentRegistry.Context;
  private flowchartWidget: FlowchartWidget;

  constructor(context: DocumentRegistry.Context, flowchartWidget: FlowchartWidget) {
    super();
    this.context = context;
    this.flowchartWidget = flowchartWidget;
    this.addClass('jp-vizContent');
  }

  protected render(): React.ReactElement<any> {
    return <VizContent context={this.context} flowchartWidget={this.flowchartWidget} />;
  }
}

export default VizContentWidget;
