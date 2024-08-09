/* eslint-disable @typescript-eslint/naming-convention */
import React, { useState, useEffect } from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';
import { Notebook, NotebookLoader } from './notebookLoader';


interface NotebookComponentProps {
  notebookIds: number[];
  loader: NotebookLoader;
}

const NotebookComponent: React.FC<NotebookComponentProps> = ({ notebookIds, loader }) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);

  useEffect(() => {
    const loadedNotebooks = notebookIds.map(id => loader.getNotebook(id)).filter(notebook => notebook) as Notebook[];
    setNotebooks(loadedNotebooks);
  }, [notebookIds, loader]);

  return (
    <div className="notebook">
      {notebooks.map(notebook => (
        <div key={notebook.notebook_id}>
          <h2>Notebook {notebook.notebook_id}</h2>
          {notebook.cells.map(cell => (
            <div key={cell.cell_id} className="cell code">
              <CodeBlock content={cell.code} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

interface CodeBlockProps {
  content: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content }) => {
  return (
    <pre className="code">
      <code>{content}</code>
    </pre>
  );
};

/**
 * A Notebook Lumino Widget that wraps a NotebookComponent.
 */
export class NotebookWidget extends ReactWidget {
  private notebookIds: number[];
  private loader: NotebookLoader;

  /**
   * Constructs a new NotebookWidget.
   */
  constructor() {
    super();
    this.notebookIds = [];
    this.loader = new NotebookLoader('/Users/mchami/ETH/PEACH/example_extension/react_notebooks/test.json'); // Update this path accordingly
    this.addClass('jp-react-widget');
  }

  /**
   * Updates the notebookIds and refreshes the component.
   */
  public setNotebookIds(notebookIds: number[]): void {
    this.notebookIds = notebookIds;
    this.update();
  }

  render(): JSX.Element {
    return <NotebookComponent notebookIds={this.notebookIds} loader={this.loader} />;
  }
}
