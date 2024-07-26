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

import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import { FlowchartWidget } from './graphWidget';
import { NotebookManager } from './notebookManager';
import { ICommandPalette } from '@jupyterlab/apputils';

import { OpenNotebookButton } from './openNotebookButton';
import { NotebookSelector } from './notebookSelector';

/**
 * Initialization data for the sidebar and cluster extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sidebar-cluster:plugin',
  autoStart: true,
  requires: [ICommandPalette, INotebookTracker, IFileBrowserFactory],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette, tracker: INotebookTracker, factory: IFileBrowserFactory) => {

    console.log('JupyterLab extension sidebar-cluster is activated!');
    const notebookManager = new NotebookManager();
    const graphWidget = new FlowchartWidget(notebookManager);
    const notebookSelector = new NotebookSelector(notebookManager, graphWidget);

    // When a notebook is opened, add the custom widget to the top
    tracker.widgetAdded.connect((sender, notebook) => {
      console.log('Notebook added');
      const toolbar = notebook.toolbar.node;
      const customWidget = notebookSelector.createSelector();

      // Insert the custom widget at the beginning of the toolbar
      toolbar.parentNode?.insertBefore(customWidget.node, toolbar.parentNode?.nextSibling as Node);
    });


    app.commands.addCommand('sidebar-cluster:open', {
      label: 'Generate sidebar graphs',
      caption: 'Generate sidebar graphs',
      execute: () => {
        const panel = tracker.currentWidget;
        if (panel) {
          notebookManager.populateCells(panel.content.widgets);
          notebookManager.showAllNotebooks();
          // Create a new button extension
          const buttonExtension = new OpenNotebookButton(notebookManager, factory);
          panel.toolbar.insertItem(11, 'showNotebook', buttonExtension.createButton());
          console.log('Button extension added to notebook');
        }
        else {
          console.log('No notebook is open');
        }

        graphWidget.id = 'my-sidebar-graph-widget';
        graphWidget.title.iconClass = 'jp-SideBar-tabIcon';
        graphWidget.title.caption = 'My Sidebar Graph Widget';

        // Add the sidebar to the left area
        app.shell.add(graphWidget, 'left');
        app.shell.activateById(graphWidget.id);

        // console.log('Changing height');
        // const mainArea = document.querySelector('.jp-Notebook') as HTMLElement;
        // mainArea.style.marginTop = '50px'; // Adjust this value to push the main area down

        notebookSelector.addOptions();
      }
    });

    palette.addItem({ command: 'sidebar-cluster:open', category: 'Extension' });
  }
};




export default plugin;
