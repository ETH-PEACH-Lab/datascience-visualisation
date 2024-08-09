import {
    DocumentWidget
  } from '@jupyterlab/docregistry';
  
  import {
    DocumentRegistry
  } from '@jupyterlab/docregistry';
  
  import VizContent from './VizContent';
  
  // VizWidget extending DocumentWidget
  class VizWidget extends DocumentWidget<VizContent, DocumentRegistry.IModel> {
    constructor(context: DocumentRegistry.Context) {
      const content = new VizContent(context);
      super({ content, context });
      this.addClass('jp-vizWidget');
    }
  }
  
  export default VizWidget;
  