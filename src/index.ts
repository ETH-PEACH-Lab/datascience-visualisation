import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { VizWidgetFactory } from './factory';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'viz-file-handler',
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

    // Create and register the widget factory
    const factory = new VizWidgetFactory({
      name: 'VIZ Widget',
      fileTypes: ['viz'],
      modelName: 'text',
      defaultFor: ['viz'],
      preferKernel: false
    });

    app.docRegistry.addWidgetFactory(factory);

    // Use the widget factory to create a new widget
    factory.widgetCreated.connect((sender, widget) => {
      app.shell.add(widget, 'main');
    });
  }
};

export default extension;
