import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IDisposable, DisposableDelegate } from '@lumino/disposable';


import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import {
  NotebookPanel,
  INotebookModel,
} from '@jupyterlab/notebook';

import { ISharedCodeCell } from '@jupyter/ydoc';
import {IOutput} from '@jupyterlab/nbformat'
import '../style/index.css';



interface Code {
  cluster_id: number;
  code: string;
  outputs: IOutput[];
  code_id: number;
}

/**
 * Initialization data for the jupyterlab_hide_code extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_hide_code:plugin',
  description:
    'A button in JupyterLab to run the code cells and then to hide the code cells.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
    console.log('JupyterLab extension jupyterlab_hide_code is activated!');
  }
};



export class ButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {

    const toggleCode = () => {
      let currCell = panel.content.activeCell;
      // NotebookActions.runAll(panel.content, context.sessionContext);
      if (currCell?.model.type === 'code') {
        let codes: Code[] = currCell?.model.metadata['codes'] as unknown as Code[];
        let code_id: number = currCell.model.metadata['code_id'] as unknown as number;
        codes.forEach((code) => {
          if (code.code_id != code_id) {
            currCell?.model.sharedModel.setSource(code.code);
            currCell?.model.setMetadata('code_id', code.code_id);
            currCell?.model.setMetadata('cluster_id', code.cluster_id);
            console.log("New code id is: ", code.code_id);
            let c = currCell?.model.sharedModel as unknown as ISharedCodeCell;
            c.setOutputs(code.outputs);
          }
        });
        // currCell.hide();
      }

      buttonShowInput.show();
    };


    const buttonShowInput = new ToolbarButton({
      className: 'myButton',
      iconClass: 'fa fa-sm fa-eye fontawesome-colors',
      onClick: toggleCode,
      tooltip: 'Show Input'
    });

    buttonShowInput.show();

    panel.toolbar.insertItem(11, 'showInput', buttonShowInput);

    return new DisposableDelegate(() => {
      buttonShowInput.dispose();
    });
  }
}

export default plugin;