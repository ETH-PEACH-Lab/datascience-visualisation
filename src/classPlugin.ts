import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
    NotebookPanel,
    INotebookModel,
} from '@jupyterlab/notebook';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { ToolbarButton } from '@jupyterlab/apputils';
import '../style/index.css';
import { NotebookManager } from './notebookManager';

export class ButtonExtension
    implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
    notebookManager: NotebookManager;

    // Create constructor
    constructor(notebookManager : NotebookManager) {
        this.notebookManager = notebookManager;
     }
    
    createNew(
        panel: NotebookPanel,
        context: DocumentRegistry.IContext<INotebookModel>
    ): IDisposable {



        const showClusters = () => {
            console.log('Creating tabs');
            this.notebookManager.populateCells(panel.content.widgets);
            this.notebookManager.showAllNotebooks();
            buttonShowInput.show();
            console.log('Populating Manager');
        };

        const buttonShowInput = new ToolbarButton({
            className: 'myButton',
            iconClass: 'fa fa-sm fa-eye fontawesome-colors',
            onClick: showClusters,
            tooltip: 'Show Input'
        });

        buttonShowInput.show();
        panel.toolbar.insertItem(11, 'showInput', buttonShowInput);

        return new DisposableDelegate(() => {
            buttonShowInput.dispose();
        });
    }
}


