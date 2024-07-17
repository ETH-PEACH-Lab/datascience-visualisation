/* eslint-disable @typescript-eslint/naming-convention */
import colorScheme from './colorScheme';
import { ISharedCodeCell } from '@jupyter/ydoc';
import { Cell, ICellModel } from '@jupyterlab/cells'
import '../style/index.css';
import { PanelLayout, Widget } from '@lumino/widgets';

export const getClassColor = (className: string): string => {
    return colorScheme[className] || '#ffffff';  // Default to white if class name is not found
};

interface CellMetadata {
    start_cell: boolean;
    class: string;
    notebook_id: number;
    cell_id: number;
}

const changeAllCells = (cells: readonly Cell<ICellModel>[], notebook_id: number) => {
    console.log('Changing to ', notebook_id);
    cells.forEach((cell) => {
        const cellMeta = cell.model.metadata as unknown as CellMetadata;
        cell.hide();
        if (cellMeta.notebook_id === notebook_id) {
            cell.show();
        }
    });
    document.querySelectorAll('.student-tab').forEach((tab) => {
        const tabElement = tab as HTMLElement;
        if (parseInt(tabElement.innerText) === notebook_id) {
          tabElement.classList.add('active');
        } else {
          tabElement.classList.remove('active');
        }
      });

}

const countNotebooks = (cells: readonly Cell<ICellModel>[]) => {
    const notebooks = new Set<number>();
    cells.forEach((cell) => {
        const cellMeta = cell.model.metadata as unknown as CellMetadata;
        notebooks.add(cellMeta.notebook_id);
    });
    return notebooks.size;
}

const createClass = (cells: readonly Cell<ICellModel>[], cell: Cell<ICellModel>) => {
    console.log('Creating class');
    const cellMeta = cell.model.metadata as unknown as CellMetadata;
    const c = cell?.model.sharedModel as unknown as ISharedCodeCell;
    c.execution_count = cellMeta.cell_id;
    if (!cellMeta.start_cell) {
      return;
    }
    const classContainer = document.createElement('div');
    classContainer.className = 'cells-class';
  
    const classHeader = document.createElement('div');
    classHeader.className = 'class-header';
    classHeader.innerText = cellMeta.class;
    classHeader.style.backgroundColor = getClassColor(cellMeta.class);
  
    classContainer.appendChild(classHeader);
  
  
    const studentContainer = document.createElement('div');
    studentContainer.className = 'class-tabs';
    classContainer.appendChild(studentContainer);
  
    const n_notebooks = countNotebooks(cells);
    for (let i = 1; i <= n_notebooks; i++) {
      console.log('Creating code ', i);
      const codeDiv = document.createElement('div');
      codeDiv.className = 'student-tab';
      codeDiv.innerText = i.toString();
      codeDiv.style.borderColor = getClassColor(cellMeta.class);
      studentContainer.appendChild(codeDiv);
  
      codeDiv.addEventListener('click', () => {
        changeAllCells(cells, i);
      });
    }
  
    const widget = new Widget({ node: classContainer });
    const layout = cell.layout as unknown as PanelLayout;
    layout?.insertWidget(0, widget);
  };
  
export class NotebookManager {
    private cells!: readonly Cell<ICellModel>[];

    public populateCells(cells: readonly Cell<ICellModel>[]){
        this.cells = cells;
    }
    public showNotebook(notebook_id: number) {
        changeAllCells(this.cells, notebook_id);
    }

    public generateNotebookTabs() {
        this.cells.forEach((cell) => { createClass(this.cells, cell); });
    }

    public getNotebookIds() {
        const notebooks = new Set<string>();
        this.cells.forEach((cell) => {
            const cellMeta = cell.model.metadata as unknown as CellMetadata;
            notebooks.add(cellMeta.notebook_id.toString());
        });
        return Array.from(notebooks);
    }

    public getCellsClass(notebook_id: number) {
        return this.cells.filter((cell) => {
            const cellMeta = cell.model.metadata as unknown as CellMetadata;
            return cellMeta.notebook_id === notebook_id;
        }).map((cell) => {
            const cellMeta = cell.model.metadata as unknown as CellMetadata
            return cellMeta.class});
    }
}