/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';

interface Cell {
  type: 'markdown' | 'code';
  content: string;
}

const NotebookComponent: React.FC = () => {
  const cells: Cell[] = [
    { type: 'code', content: 'print("Hello, world!")' },
    { type: 'code', content: 'x = 42\nprint(x)' },
  ];

  return (
    <div className="notebook">
      {cells.map((cell, index) => (
        <div key={index} className={`cell ${cell.type}`}>
            <CodeBlock content={cell.content} />
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
  /**
   * Constructs a new NotebookWidget.
   */
  constructor() {
    super();
    this.addClass('jp-react-widget');
  }

  render(): JSX.Element {
    return <NotebookComponent />;
  }
}
