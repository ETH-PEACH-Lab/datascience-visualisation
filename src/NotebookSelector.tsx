// NotebookSelector.tsx
import React, { useState, useEffect } from 'react';
import '../style/notebookSelector.css';

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
    console.log("Notebook : ", selectedValue);

    console.log("Notebook ID: ", notebookId);
    if (String(selectedValue) === "ALL") {
      console.log("All notebooks selected");
      setShownNotebooks(new Set(notebookIds));

    }
    else if (!shownNotebooks.has(notebookId) && notebookIds.includes(notebookId)) {
      const newShownNotebooks = new Set(shownNotebooks);
      newShownNotebooks.add(notebookId);
      setShownNotebooks(newShownNotebooks);
    }
    setSelectedValue(''); // Clear the input after adding
  };

  const handleRemoveNotebook = (notebookId: number) => {
    const newShownNotebooks = new Set(shownNotebooks);
    newShownNotebooks.delete(notebookId);
    setShownNotebooks(newShownNotebooks);
  };

  return (
    <div className="selector-container">
      <div className="current-selection-text">Current selection:</div>
      <div className="selected-elements" id="selected-elements">
        {Array.from(shownNotebooks).map(notebookId => (
          <div key={notebookId} className="element">
            {notebookId}
            <button className="remove-button" onClick={() => handleRemoveNotebook(notebookId)}>Remove</button>
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
      />
      <datalist id="elements">
 
        {notebookIds.map(id => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
          <option key={"All"} value={"ALL"}>
            {"All"}
          </option>
        
      </datalist>
      <button id="add-button" onClick={handleAddNotebook}>
        +
      </button>
    </div>
  );
};

export default NotebookSelector;