import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { VizWidgetFactory } from './factory';
import { FlowchartWidget } from './Flowchart';
import { WidgetTracker } from '@jupyterlab/apputils';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'viz-file-ext',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension viz-file-handler is activated!');

    // Register the new file type
    app.docRegistry.addFileType({
      name: 'viz',
      displayName: 'VIZ File',
      extensions: ['.viz'],
      fileFormat: 'text',
      mimeTypes: ['application/json'],
      contentType: 'file',
    });
    
    const flowchartWidget = new FlowchartWidget();

    // Add the FlowchartWidget to the left sidebar
    flowchartWidget.id = 'flowchart-widget';
    flowchartWidget.title.iconClass = 'jp-GraphIcon jp-SideBar-tabIcon';
    flowchartWidget.title.caption = 'Flowchart';

    const tracker = new WidgetTracker<FlowchartWidget>({
      namespace: 'flowchart-widget'
    });

    tracker.add(flowchartWidget);
    app.shell.add(flowchartWidget, 'left', { rank: 900 });

    // Create and register the widget factory
    const factory = new VizWidgetFactory({
      name: 'VIZ Widget',
      fileTypes: ['viz'],
      modelName: 'text',
      defaultFor: ['viz'],
      preferKernel: false
    },
    flowchartWidget);
    
    app.docRegistry.addWidgetFactory(factory);

    // Use the widget factory to create a new widget
    factory.widgetCreated.connect((sender, widget) => {
      app.shell.add(widget, 'main');
    });
  }
};

export default extension;
