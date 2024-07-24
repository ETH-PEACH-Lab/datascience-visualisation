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
            addEliotToCell(cell);  // Add Eliot to each cell
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

const removeClass = (cell: Cell<ICellModel>) => {
    const layout = cell.layout as unknown as PanelLayout;
    for (let i = layout.widgets.length - 1; i >= 0; i--) {
        const widget = layout.widgets[i];
        if (widget instanceof ClassWidget) {
            layout.removeWidget(widget);
        }
    }
}

const addEliotToCell = (cell: Cell<ICellModel>) => {
    const cellMeta = cell.model.metadata as unknown as CellMetadata;

    // Check if Eliot container already exists
    if (!cell.node.querySelector('.eliot-container')) {
        // Create the container for "Eliot"
        const eliotContainer = document.createElement('div');
        eliotContainer.className = 'eliot-container';
        eliotContainer.innerText = "Student " + String(cellMeta.notebook_id+1);
        eliotContainer.style.position = 'absolute';
        eliotContainer.style.left = '0';
        eliotContainer.style.top = '50%';
        eliotContainer.style.transform = 'translateY(-50%)';
        eliotContainer.style.backgroundColor = 'gray';
        eliotContainer.style.color = 'white';
        eliotContainer.style.padding = '5px';
        // Append the container to the cell's node
        cell.node.appendChild(eliotContainer);
        cell.node.style.position = 'relative'; // Ensure the parent is positioned

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
        // Add Eliot to all cells initially
        this.cells.forEach(cell => addEliotToCell(cell));
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
                addEliotToCell(cell);  // Add Eliot to each cell
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
            addEliotToCell(cell);  // Add Eliot to each cell
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
}
