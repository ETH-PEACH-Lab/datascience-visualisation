import React, { useState } from 'react';
import '../style/notebookSelector.css';

interface NotebookSelectorProps {
  notebookIds: number[];
  notebookNames: string[];
  onSelectionChange: (selectedIds: number[]) => void;
  selectedNotebooks: number[];
}

const NotebookSelector: React.FC<NotebookSelectorProps> = ({ notebookIds, notebookNames, onSelectionChange, selectedNotebooks }) => {
  const [selectedValue, setSelectedValue] = useState<string>('');


  const handleRemoveNotebook = (notebookId: number) => {
    const newSelectedNotebooks = selectedNotebooks.filter(id => id !== notebookId);
    if (newSelectedNotebooks.length === 0) {
      onSelectionChange([-2]); // Add "ALL" if no notebooks are selected
    } else {
      onSelectionChange(newSelectedNotebooks);
    }
  };

  const handleAddNotebook = () => {
    const notebookId = selectedValue === "All Notebooks" ? -2 : parseInt(selectedValue.match(/\d+/)?.[0] || '', 10);
    console.log('Current notebook IDs:', selectedNotebooks);
    if (notebookId === -2) {
      onSelectionChange([-2]); // If "ALL" is selected, clear other selections and set "ALL"
    } else if (!selectedNotebooks.includes(notebookId) && notebookIds.includes(notebookId)) {
      const newSelectedNotebooks = [...selectedNotebooks, notebookId].filter(id => id !== -2); // Remove "ALL" (-2) before adding a specific notebook
      onSelectionChange(newSelectedNotebooks);
    }
    setSelectedValue(''); // Clear the input after adding
  };

  return (
    <div className="selector-container">
      <div className="current-selection-text">Current selection:</div>
      <div className="selected-elements" id="selected-elements">
        {selectedNotebooks.map(notebookId => (
          <div key={notebookId} className="element">
            {notebookId === -2 ? "All Notebooks" : "Notebook " + notebookId + ": " + notebookNames[notebookIds.indexOf(notebookId)]}
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
        placeholder="Select notebook"
      />
      <datalist id="elements">
        {notebookIds.map(id => (
          <option key={id} value={id === -2 ? "All Notebooks" : "Notebook " + id}>
            {id === -2 ? "ALL" : notebookNames[notebookIds.indexOf(id)]}
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
