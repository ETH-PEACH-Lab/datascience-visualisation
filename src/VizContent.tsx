import {
    ReactWidget
  } from '@jupyterlab/apputils';
  
  import {
    DocumentRegistry
  } from '@jupyterlab/docregistry';
  
  import * as React from 'react';
  import VizComponent, { LoadingComponent, DataNotFoundComponent, VizData } from './VizComponent';
  import NotebookSelector from './NotebookSelector';
  
  class VizContent extends ReactWidget {
    private context: DocumentRegistry.Context;
    private selectedNotebooks: number[] = [];
  
    constructor(context: DocumentRegistry.Context) {
      super();
      this.context = context;
      this.addClass('jp-vizContent');
  
      // Listen for changes in the document and re-render the content
      context.ready.then(() => {
        this.context.model.contentChanged.connect(this.update, this);
        this.update();
      });
    }
  
    handleNotebookSelection = (selectedIds: number[]) => {
      this.selectedNotebooks = selectedIds;
      this.update(); // Re-render the widget when the selection changes
    };
  
    // Render the React component with the file's JSON data
    protected render(): React.ReactElement<any> {
      if (!this.context.isReady) {
        return <LoadingComponent />;
      }
  
      const content = this.context.model.toString();
      let jsonData: VizData = { notebooks: [] };
  
      if (content.trim() === "") {
        // If content is empty, display a message
        return <DataNotFoundComponent />;
      }
  
      try {
        jsonData = JSON.parse(content);
      } catch (error) {
        console.error("Error parsing JSON", error);
      }
  
      const selectedNotebooks = jsonData.notebooks.filter(notebook =>
        this.selectedNotebooks.includes(notebook.notebook_id)
      );
  
      return (
        <div>
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
  