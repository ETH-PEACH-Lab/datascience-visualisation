import {
  ReactWidget
} from '@jupyterlab/apputils';

import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import * as React from 'react';
import VizComponent, { LoadingComponent, DataNotFoundComponent, VizData, NotebookCellWithID } from './VizComponent';
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
    this.selectedNotebookIds = selectedIds;
    this.update(); // Re-render the widget when the selection changes

    const content = this.context.model.toString();
    let jsonData: VizData = { notebooks: [] };

    if (content.trim() !== "") {
      try {
        jsonData = JSON.parse(content);
      } catch (error) {
        console.error("Error parsing JSON", error);
        return;
      }

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

    if (content.trim() === "") {
      return <DataNotFoundComponent />;
    }

    try {
      jsonData = JSON.parse(content);
    } catch (error) {
      console.error("Error parsing JSON", error);
    }

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
        <VizComponent data={{ notebooks: selectedNotebooks }} />
      </div>
    );
  }
}

export default VizContent;
