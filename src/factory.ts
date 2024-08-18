import {
    ABCWidgetFactory, DocumentRegistry
  } from '@jupyterlab/docregistry';
  
  import VizWidget from './VizWidget';
import { FlowchartWidget } from './Flowchart';
  
  export class VizWidgetFactory extends ABCWidgetFactory<VizWidget, DocumentRegistry.IModel> {
    flowchartWidget: FlowchartWidget;
    constructor(options: DocumentRegistry.IWidgetFactoryOptions, flowchartWidget: FlowchartWidget) {
      super(options);
      this.flowchartWidget = flowchartWidget;
    }
    protected createNewWidget(context: DocumentRegistry.Context): VizWidget {
      return new VizWidget(context, this.flowchartWidget);
    }
  }
  