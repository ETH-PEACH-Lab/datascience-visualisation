/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable prettier/prettier */
/* eslint-disable prefer-const */
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

import { Cell, ICellModel } from '@jupyterlab/cells'

import { IOutput } from '@jupyterlab/nbformat';

import { ISharedCodeCell } from '@jupyter/ydoc';

import '../style/index.css';
import { PanelLayout, Widget } from '@lumino/widgets';


interface Code {
  code : string;
  notebook_id : number;
  cell_id : number;
  output : IOutput[];
}

interface CellMetadata {
  start_cell : boolean;
  class : string;
  codes : Code[];
}

/**
 * Change the code of a cell
 */
const changeCode = (cell: Cell<ICellModel>, code: Code) => {
  cell.model.sharedModel.setSource(code.code);
  const c = cell?.model.sharedModel as unknown as ISharedCodeCell;
  c.execution_count = code.cell_id;
  // console.log('Setting outputs', code.output);
  // c.setOutputs(code.output);
};



const classes = [
  { label: 'Data Extraction', color: '#6abf4b' }, // Green
  { label: 'Data Transform', color: '#4b98bf' }, // Blue
  { label: 'Visualization', color: '#bf4b4b' }, // Red
  { label: 'Debug', color: '#bf4b98' }, // Pink
  { label: 'Model Training', color: '#bfb24b' }, // Yellow
];

const changeAllCells = (cells: readonly Cell<ICellModel>[], notebook_id: number) => {
  cells.forEach((cell) => {
    const cellMeta = cell.model.metadata as unknown as CellMetadata;
    cell.hide();
    cellMeta.codes.forEach((code) => {
      if (code.notebook_id === notebook_id) {
        cell.show();
        console.log('Changing code', code);
        changeCode(cell, code);
      }
    });
  });
}

const createClass = (cells: readonly Cell<ICellModel>[], cell: Cell<ICellModel>, cellMeta: CellMetadata) => {
  if (!cellMeta.start_cell) {
    return;
  }
  const classContainer = document.createElement('div');
  classContainer.className = 'cells-class';
  
  const classHeader = document.createElement('div');
  classHeader.className = 'class-header';
  classHeader.innerText = cellMeta.class;
  classHeader.style.backgroundColor = classes.find((c) => c.label === cellMeta.class)?.color as string;

  classContainer.appendChild(classHeader);


  const studentContainer = document.createElement('div');
  studentContainer.className = 'class-tabs';
  classContainer.appendChild(studentContainer);

  cellMeta.codes.forEach((code) => {
    console.log('Creating code ', code.notebook_id);
    const codeDiv = document.createElement('div');
    codeDiv.className = 'student-tab';
    codeDiv.innerText = code.notebook_id.toString();
    codeDiv.style.borderColor = classes.find((c) => c.label === cellMeta.class)?.color as string;
    studentContainer.appendChild(codeDiv);

    codeDiv.addEventListener('click', () => {
      changeAllCells(cells, code.notebook_id);
      console.log('Changing to ', code.notebook_id);
      document.querySelectorAll('.student-tab').forEach((tab) => {
        const tabElement = tab as HTMLElement;
        if (parseInt(tabElement.innerText) === code.notebook_id) {
          tabElement.classList.add('active');
        } else {
          tabElement.classList.remove('active');
        }
      });
    });
  });

  const widget = new Widget({ node: classContainer });
  const layout = cell.layout as unknown as PanelLayout;
  layout?.insertWidget(0, widget);

}

/**
 * Initialization data for the jupyterlab_hide_code extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_hide_code:plugin',
  description:
    'A button in JupyterLab to run the code cells and then to hide the code cells.',
  autoStart: 'defer',
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
    const showClusters = () => {
      console.log('Showing clusters');
      panel.content.widgets.forEach((cell) => {

        createClass(panel.content.widgets, cell, cell.model.metadata as unknown as CellMetadata);
      });

      buttonShowInput.show();
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

export default plugin;