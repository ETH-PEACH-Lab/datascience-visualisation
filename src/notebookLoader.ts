/* eslint-disable @typescript-eslint/naming-convention */
interface Cell {
    cell_id: number;
    code: string;
}

interface Notebook {
    notebook_id: number;
    cells: Cell[];
}

interface NotebookData {
    notebooks: Notebook[];
}

export class NotebookLoader {
    private data: NotebookData;

    constructor() {
        this.data = { notebooks: [] };
    }

    async load(path: string): Promise<void> {
        const response = await fetch(path);
        const data: NotebookData = await response.json();
        this.data = data;
    }

}
