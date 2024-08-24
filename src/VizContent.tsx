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

class VizContent extends ReactWidget {
  private context: DocumentRegistry.Context;
  private selectedNotebookIds: number[] = [];
  private flowchartWidget: FlowchartWidget;

  constructor(context: DocumentRegistry.Context, flowchartWidget: FlowchartWidget) {
    super();
    this.context = context;
    this.flowchartWidget = flowchartWidget;
    this.addClass('jp-vizContent');

    // Listen for changes in the document and re-render the content
    context.ready.then(() => {
      this.context.model.contentChanged.connect(this.update, this);
      this.update();
    });
  }


  handleNotebookSelection = (selectedIds: number[]) => {
    // Remove every element from selectedNotebookIds directly in the
    while(this.selectedNotebookIds.length > 0){
      this.selectedNotebookIds.pop();
    }

    // Add every element from selectedIds that is not in selectedNotebookIds
    selectedIds.forEach(selectedId => {
      if (!this.selectedNotebookIds.includes(selectedId)) {
        this.selectedNotebookIds.push(selectedId);
      }
    });

    this.update(); // Re-render the widget when the selection changes

    const content = this.context.model.toString();

    //console.log(content)
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
        
          newNotebook.cells.push(cellWithNotebookId);        }
        )
      });
      jsonData.notebooks.push(newNotebook);
      this.update(); // Re-render the widget when the selection changes

      // Filter cells from selected notebooks only
      const selectedCells: NotebookCellWithID[] = jsonData.notebooks
        .filter(notebook => selectedIds.includes(notebook.notebook_id))
        .flatMap(notebook =>
          notebook.cells.map(cell => ({
            ...cell,
            notebook_id: notebook.notebook_id,  // Add notebook_id to each cell
          }))
        );

      this.flowchartWidget.updateGraph(selectedCells);
    }
  };

  protected render(): React.ReactElement<any> {
    if (!this.context.isReady) {
      return <LoadingComponent />;
    }

    const content = this.context.model.toString();
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
      }
      )
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
      }
      )
    });
    jsonData.notebooks.push(newNotebook);
    // Ensure only selected notebooks are displayed
    const selectedNotebooks = jsonData.notebooks.filter(notebook =>
      this.selectedNotebookIds.includes(notebook.notebook_id)
    );

    return (
      <div style={{ height: '100%', overflowY: 'auto' }}> {/* Scrollable container */}
        <NotebookSelector
          notebookIds={jsonData.notebooks.map(notebook => notebook.notebook_id)}
          onSelectionChange={this.handleNotebookSelection}
        />
        <VizComponent 
          data={{ notebooks: selectedNotebooks }}
          onSelectNotebook={this.handleNotebookSelection}
        />
      </div>
    );
  }
}

export default VizContent;
