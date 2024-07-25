/* eslint-disable @typescript-eslint/naming-convention */
import colorScheme from './colorScheme';
// import { ISharedCodeCell } from '@jupyter/ydoc';
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

// const countNotebooks = (cells: readonly Cell<ICellModel>[]) => {
//     const notebooks = new Set<number>();
//     cells.forEach((cell) => {
//         const cellMeta = cell.model.metadata as unknown as CellMetadata;
//         notebooks.add(cellMeta.notebook_id);
//     });
//     return notebooks.size;
// }

const removeClass = (cell: Cell<ICellModel>) => {
    const layout = cell.layout as unknown as PanelLayout;
    for(let i = 0; i < layout.widgets.length; i++) {
        const widget = layout.widgets[i];
        if (widget instanceof ClassWidget) {
            layout.removeWidget(widget);
        }
    }
}

const createClass = (cell: Cell<ICellModel>) => {
    const cellMeta = cell.model.metadata as unknown as CellMetadata;

    const classContainer = document.createElement('div');
    classContainer.className = 'cells-class';

    const classHeader = document.createElement('div');
    classHeader.className = 'class-header';
    classHeader.innerText = cellMeta.class;
    classHeader.style.backgroundColor = getClassColor(cellMeta.class);

    classContainer.appendChild(classHeader);


    const widget = new ClassWidget({ node: classContainer });
    const layout = cell.layout as unknown as PanelLayout;
    layout?.insertWidget(0, widget);
};

class ClassWidget extends Widget {

}

export class NotebookManager {
    private cells!: readonly Cell<ICellModel>[];

    public populateCells(cells: readonly Cell<ICellModel>[]) {
        this.cells = cells;
    }
    public showNotebook(notebook_id: number) {
        changeAllCells(this.cells, notebook_id);
    }

    public showNotebooks(notebook_ids: number[]) {
        console.log('Showing notebooks', notebook_ids);
        const classesCreated = new Set<string>();
        for (const cell of this.cells) {
            const cellMeta = cell.model.metadata as unknown as CellMetadata;
            removeClass(cell);
            console.log('Checking cell for notebook', cellMeta.notebook_id);
            if (notebook_ids.includes(cellMeta.notebook_id)) {
                if (!classesCreated.has(cellMeta.class)) {
                    createClass(cell);
                    classesCreated.add(cellMeta.class);
                }
                cell.show();
            } else {
                cell.hide();
            }
        }
    }

    public showAllNotebooks() {
        const classesCreated = new Set<string>();
        for (const cell of this.cells) {
            const cellMeta = cell.model.metadata as unknown as CellMetadata;
            removeClass(cell);
            const promptNode = cell.node.querySelector('.jp-InputPrompt');
            if (promptNode) {
                promptNode.textContent = cellMeta.notebook_id.toString();
            }        
            if (!classesCreated.has(cellMeta.class)) {
                createClass(cell);
                classesCreated.add(cellMeta.class);
            }
            cell.show();

        }
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
            return cellMeta.class
        });
    }

    public getCurrentNotebookIds(){
        const notebooks = new Set<string>();
        this.cells.forEach((cell) => {
            const cellMeta = cell.model.metadata as unknown as CellMetadata;
            if (cell.isVisible) {
                notebooks.add(cellMeta.notebook_id.toString());
            }
        });
        return Array.from(notebooks);
    }
}