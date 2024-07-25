import { Widget } from "@lumino/widgets";
import { NotebookManager } from "./notebookManager";


export class NotebookSelector {
    notebookManager: NotebookManager;
    shownNotebooks: Set<string>;

    constructor(notebookManager: NotebookManager) {
        this.notebookManager = notebookManager;
        this.shownNotebooks = new Set<string>();
    }

    public createSelector() {
        console.log('Creating selector'); 
        
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'selector-container';

        const currentSelectionText = document.createElement('div');
        currentSelectionText.className = 'current-selection-text';
        currentSelectionText.innerText = 'Current selection:';
        selectorContainer.appendChild(currentSelectionText);

        const selectedElements = document.createElement('div');
        selectedElements.id = 'selected-elements';
        selectedElements.className = 'selected-elements';
        selectorContainer.appendChild(selectedElements);

        const addButton = document.createElement('button');
        addButton.id = 'add-button';
        addButton.innerText = '+';
        selectorContainer.appendChild(addButton);

        const elementSelector = document.createElement('select');
        elementSelector.id = 'element-selector';
        elementSelector.className = 'element-selector';
        selectorContainer.appendChild(elementSelector);

        addButton.addEventListener('click', () => {
            var selectedValue = elementSelector.options[elementSelector.selectedIndex].text;

            var newElement = document.createElement('div');
            newElement.className = 'element';
            newElement.textContent = selectedValue;

            this.shownNotebooks.add(selectedValue);
            selectedElements.appendChild(newElement);
        });

        return new Widget({ node: selectorContainer });

    }

    public addOptions(){
        console.log('Adding options');
        const elementSelector = document.getElementById('element-selector') as HTMLSelectElement;
        this.notebookManager.getNotebookIds().forEach((notebookId) => {
            const option = document.createElement('option');
            option.value = notebookId.toString();
            option.innerText = notebookId.toString();
            elementSelector.appendChild(option);
        });
    }
}

