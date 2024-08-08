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


import { OpenNotebookButton } from './openNotebookButton';
import { NotebookSelector } from './notebookSelector';



/**
 * Initialization data for the sidebar and cluster extension.
 */


const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sidebar-cluster:plugin',
  autoStart: true,
  requires: [INotebookTracker, IFileBrowserFactory],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker, factory: IFileBrowserFactory) => {


    // When a notebook is opened, add the custom widget to the top
    tracker.widgetAdded.connect((sender, panel) => {
      panel.context.ready.then(() => {
        if (!panel.content.model?.sharedModel.getMetadata('visualization')){
          return;
        }

          // Initialize the classes
          const notebookManager = new NotebookManager();
          const graphWidget = new FlowchartWidget(notebookManager);
          const notebookSelector = new NotebookSelector(notebookManager, graphWidget);

          // Instantiating the notebook manager
          notebookManager.populateCells(panel.content.widgets);
          notebookManager.showNotebooks([]);

          // Adding the toolbar selector
          const toolbar = panel.toolbar.node;
          const customWidget = notebookSelector.createSelector();
          toolbar.parentNode?.insertBefore(customWidget.node, toolbar.parentNode?.nextSibling as Node);
          notebookSelector.addOptions();
          console.log('Selector added to toolbar');

          // Create the Open Notebooks button
          const buttonExtension = new OpenNotebookButton(notebookManager, factory);
          panel.toolbar.insertItem(11, 'showNotebook', buttonExtension.createButton());
          console.log('Button extension added to notebook');

          // Add the graph widget to the sidebar
          graphWidget.id = 'my-sidebar-graph-widget';
          graphWidget.title.iconClass = 'jp-SideBar-tabIcon';
          graphWidget.title.caption = 'My Sidebar Graph Widget';
          app.shell.add(graphWidget, 'left');
          app.shell.activateById(graphWidget.id);
          console.log('Graph widget added to sidebar');

        });
    });
  }
};




export default plugin;
