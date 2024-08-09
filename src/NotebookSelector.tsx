/* eslint-disable @typescript-eslint/naming-convention */
import React, { useState, useEffect } from 'react';

interface NotebookSelectorProps {
  notebookIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

const NotebookSelector: React.FC<NotebookSelectorProps> = ({ notebookIds, onSelectionChange }) => {
  const [shownNotebooks, setShownNotebooks] = useState<Set<number>>(new Set());
  const [selectedValue, setSelectedValue] = useState<string>('');

  useEffect(() => {
    // Trigger the callback when shownNotebooks changes
    onSelectionChange(Array.from(shownNotebooks));
  }, [shownNotebooks, onSelectionChange]);

  const handleAddNotebook = () => {
    const notebookId = Number(selectedValue);
    if (!shownNotebooks.has(notebookId) && notebookIds.includes(notebookId)) {
      const newShownNotebooks = new Set(shownNotebooks);
      newShownNotebooks.add(notebookId);
      setShownNotebooks(newShownNotebooks);
    }
    setSelectedValue(''); // Clear the input after adding
  };

  return (
    <div className="selector-container" style={{ padding: '10px', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
      <div className="current-selection-text" style={{ marginBottom: '10px' }}>
        Current selection:
      </div>
      <div className="selected-elements" id="selected-elements" style={{ marginBottom: '10px' }}>
        {Array.from(shownNotebooks).map(notebookId => (
          <div key={notebookId} className="element" style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '5px' }}>
            {notebookId}
          </div>
        ))}
      </div>
      <input
        type="text"
        list="elements"
        id="element-selector"
        className="element-selector"
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        placeholder="Select notebook ID"
        style={{ marginRight: '10px' }}
      />
      <datalist id="elements">
        {notebookIds.map(id => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </datalist>
      <button id="add-button" onClick={handleAddNotebook}>
        +
      </button>
    </div>
  );
};

export default NotebookSelector;
