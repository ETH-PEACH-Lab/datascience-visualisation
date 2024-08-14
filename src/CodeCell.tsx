import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import '../style/CodeCell.css';

interface CodeCellProps {
  code: string;
  clusterLabel: string; // Add the cluster label as a prop
    notebook_id: number; // add the notebook_id as a prop
}

const CodeCell: React.FC<CodeCellProps> = ({ code, clusterLabel,notebook_id }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      const view = new EditorView({
        doc: code,
        extensions: [basicSetup, python()],
        parent: editorRef.current,
      });

      // Clean up the view on component unmount
      return () => {
        view.destroy();
      };
    }
  }, [code]);

  return (
    <div className="code-cell-container">
        <div className="notebook-id">Student {notebook_id}</div> {/* Display the notebook ID */}
      <div ref={editorRef} className="code-editor" />
      <div className="cluster-label">{clusterLabel}</div> {/* Display the cluster label */}
    </div>
  );
};

export default CodeCell;
