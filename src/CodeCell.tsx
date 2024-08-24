import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import '../style/CodeCell.css';

interface CodeCellProps {
  code: string;
  clusterLabel: string; // Existing prop
  notebook_id: number;   // Existing prop
  onSelectNotebook: (notebookId: [number]) => void; // New prop to handle notebook selection
}


const CodeCell: React.FC<CodeCellProps> = ({ code, clusterLabel, notebook_id, onSelectNotebook }) => {
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
      <button 
        className="notebook-id-button" 
        onClick={() => onSelectNotebook([notebook_id])}
      >
        Student {notebook_id}
      </button> {/* Button to select this student */}
      <div ref={editorRef} className="code-editor" />
      <div className="cluster-label">{clusterLabel}</div> {/* Display the cluster label */}
    </div>
  );
};

export default CodeCell;
