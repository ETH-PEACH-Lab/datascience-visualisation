/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable prefer-const */
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  INotebookTracker,
} from '@jupyterlab/notebook';

import { FlowchartWidget } from './graphWidget';
import { NotebookManager } from './notebookManager';
import { ICommandPalette } from '@jupyterlab/apputils';


/**
 * Initialization data for the sidebar and cluster extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sidebar-cluster:plugin',
  autoStart: true,
  requires: [ICommandPalette, INotebookTracker],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette, tracker: INotebookTracker) => {

    console.log('JupyterLab extension sidebar-cluster is activated!');
    const notebookManager = new NotebookManager();

    app.commands.addCommand('sidebar-cluster:open', {
      label: 'Generate sidebar graphs',
      caption: 'Generate sidebar graphs',
      execute: () => {
        const panel = tracker.currentWidget;
        if(panel){
          notebookManager.populateCells(panel.content.widgets);
          notebookManager.showAllNotebooks();  
        }
        else{
          console.log('No notebook is open');
        }
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
