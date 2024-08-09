import {
    DocumentWidget
  } from '@jupyterlab/docregistry';
  
  import {
    DocumentRegistry
  } from '@jupyterlab/docregistry';
  
  import VizContent from './VizContent';
import { FlowchartWidget } from './Flowchart';
  
  // VizWidget extending DocumentWidget
  class VizWidget extends DocumentWidget<VizContent, DocumentRegistry.IModel> {
    constructor(context: DocumentRegistry.Context, flowchartWidget: FlowchartWidget) {
      const content = new VizContent(context, flowchartWidget);
      super({ content, context });
      this.addClass('jp-vizWidget');
    }
  }
  
  export default VizWidget;
  