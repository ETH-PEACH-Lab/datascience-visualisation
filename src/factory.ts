import {
    ABCWidgetFactory, DocumentRegistry
  } from '@jupyterlab/docregistry';
  
  import VizWidget from './VizWidget';
  
  export class VizWidgetFactory extends ABCWidgetFactory<VizWidget, DocumentRegistry.IModel> {
    protected createNewWidget(context: DocumentRegistry.Context): VizWidget {
      return new VizWidget(context);
    }
  }
  