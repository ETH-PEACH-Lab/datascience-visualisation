import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
    NotebookPanel,
    INotebookModel,
} from '@jupyterlab/notebook';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import {
    IFileBrowserFactory
  } from '@jupyterlab/filebrowser';
  
import { ToolbarButton } from '@jupyterlab/apputils';
import '../style/index.css';
import { NotebookManager } from './notebookManager';


export const button = new ToolbarButton({
    className: 'myButton',
    iconClass: 'fa fa-sm fa-eye fontawesome-colors',
    onClick: () => {
        console.log('Button clicked');
    },
    tooltip: 'Show Input'
});

export class OpenNotebookButton {
    notebookManager: NotebookManager;
    factory: IFileBrowserFactory;

    constructor(notebookManager : NotebookManager, factory: IFileBrowserFactory) {
        this.notebookManager = notebookManager;
        this.factory = factory;
    }

    openNotebooks = () => {
        console.log('Opening notebooks');
        const notebookIds = this.notebookManager.getCurrentNotebookIds();
        const fileBrowser = this.factory.tracker.currentWidget;
        const filePath = '/notebooks/';
        notebookIds.forEach((notebookId) => {
            const notebookPath = filePath + notebookId + '.ipynb';
            if (fileBrowser) {
                fileBrowser.model.manager.openOrReveal(notebookPath);
            }
        });
    }

    public createButton() {
        const buttonShowInput = new ToolbarButton({
            className: 'myButton',
            label: 'Open Notebooks',
            onClick: this.openNotebooks,
            tooltip: 'Open Notebooks'
        });
        return buttonShowInput;
    }
}

export class ButtonExtension
    implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
    notebookManager: NotebookManager;
    factory: IFileBrowserFactory;

    // Create constructor
    constructor(notebookManager : NotebookManager, factory: IFileBrowserFactory) {
        this.notebookManager = notebookManager;
        this.factory = factory;
     }
    
    createNew(
        panel: NotebookPanel,
        context: DocumentRegistry.IContext<INotebookModel>
    ): IDisposable {


        const openNotebooks = () => {
            console.log('Opening notebooks');
            const notebookIds = this.notebookManager.getCurrentNotebookIds();
            const fileBrowser = this.factory.tracker.currentWidget;
            const filePath = '/notebooks/';
            notebookIds.forEach((notebookId) => {
                const notebookPath = filePath + notebookId + '.ipynb';
                if (fileBrowser) {
                    fileBrowser.model.manager.openOrReveal(notebookPath);
                }
            });
        };

        const buttonShowInput = new ToolbarButton({
            className: 'myButton',
            label: 'Open Notebooks',
            onClick: openNotebooks,
            tooltip: 'Open Notebooks'
        });

        buttonShowInput.show();
        panel.toolbar.insertItem(11, 'showInput', buttonShowInput);
        console.log('Button added');
        return new DisposableDelegate(() => {
            buttonShowInput.dispose();
        });
    }
}


