/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable prefer-const */
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';


import { FlowchartWidget } from './graphWidget';
import { ButtonExtension } from './classPlugin';
import { NotebookManager } from './helper';
import { ICommandPalette } from '@jupyterlab/apputils';




/**
 * Initialization data for the sidebar and cluster extension.
 */


const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sidebar-cluster:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {

    console.log('JupyterLab extension sidebar-cluster is activated!');
    const notebookManager = new NotebookManager();
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension(notebookManager));
    
    app.commands.addCommand('sidebar-cluster:open', {
      label: 'Generate sidebar graphs',
      caption: 'Generate sidebar graphs',
      execute: () => {
        const widget = new FlowchartWidget(notebookManager);
        widget.id = 'my-sidebar-graph-widget';
        widget.title.iconClass = 'jp-SideBar-tabIcon';
        widget.title.caption = 'My Sidebar Graph Widget';

        // Add the sidebar to the left area
        app.shell.add(widget, 'left');
        app.shell.activateById(widget.id);
      }
    });

    palette.addItem({ command: 'sidebar-cluster:open', category: 'Extension' });
  }
};




export default plugin;
