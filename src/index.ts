import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IDisposable, DisposableDelegate } from '@lumino/disposable';


import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import {
  NotebookPanel,
  INotebookModel,
} from '@jupyterlab/notebook';

import { Cell, ICellModel } from '@jupyterlab/cells'

import { IOutput } from '@jupyterlab/nbformat';

import { ISharedCodeCell } from '@jupyter/ydoc';

import '../style/index.css';
import { PanelLayout, Widget } from '@lumino/widgets';



interface Code {
  cell_id: number;
  cluster_id: number;
  code: string;
  outputs: IOutput[];
  code_id: number;
}

/**
 * Change the code of a cell
 */
const changeCode = (cell: Cell<ICellModel>, code: Code) => {
  cell.model.sharedModel.setSource(code.code);
  const c = cell?.model.sharedModel as unknown as ISharedCodeCell;
  c.setOutputs(code.outputs);
};

/**
 * Populate the cluster tab with the codes associated to the cluster_id
 */
const populateCluster = (codes: Code[], cell: Cell<ICellModel>) => {
  const codeContainer = document.createElement('div');
  codeContainer.className = 'tab-container';

  // Create the code tabs
  let codeDivs: Map<number, HTMLDivElement> = new Map();
  codes.forEach((code) => {
    const codeDiv = document.createElement('div');
    codeDiv.className = 'tab';
    codeDiv.innerText = code.code_id.toString();
    codeDivs.set(code.code_id, codeDiv);
    codeContainer.appendChild(codeDiv);
  });

  // Add event listeners to the code tabs that change the code of the cell and highlight the active tab
  codeDivs.forEach((codeDiv, code_id) => {
    codeDiv.addEventListener('click', () => {
      codeDivs.forEach((c) => {
        c.classList.remove('active');
      });
      codeDiv.classList.add('active');
      changeCode(cell, codes.find((c) => c.code_id === code_id) as Code);
      console.log(`Code ${codeDiv.innerText} clicked`)
    });
  });

  return codeContainer;
}

/**
 * Get a map from cluster_id to codes
 */
const getCodeClusters = (codes: Code[]) => {
  let clusters: Map<number, Code[]> = new Map();
  codes.forEach((code) => {
    if (clusters.has(code.cluster_id)) {
      clusters.get(code.cluster_id)?.push(code);
    } else {
      clusters.set(code.cluster_id, [code]);
    }
  });

  return clusters;
};

/**
 * Create the cluster tabs and the code tabs
 */
const createClusters = (cell: Cell<ICellModel>, codes: Code[]) => {
  const layout = cell.layout as unknown as PanelLayout;
  const clusters = getCodeClusters(codes);
  const mainContainer = document.createElement('div');
  const clusterContainer = document.createElement('div');
  clusterContainer.className = 'tab-container';
  mainContainer.appendChild(clusterContainer);
  let clusterTabs: Map<number, HTMLDivElement> = new Map();
  let allCodeTabs: Map<number, HTMLDivElement> = new Map();

  // Create the cluster tabs and populate the code tabs
  clusters.forEach((codes, cluster_id) => {
    const clusterTab = document.createElement('div');
    clusterTab.className = 'tab';
    clusterTab.innerText = `Cluster ${cluster_id}`;
    clusterTab.dataset.cluster_id = cluster_id.toString();
    const codeTabs = populateCluster(codes, cell);
    codeTabs.style.display = 'none';
    clusterTabs.set(cluster_id, clusterTab);
    allCodeTabs.set(cluster_id, codeTabs);


    mainContainer.appendChild(codeTabs);
    clusterContainer.appendChild(clusterTab);
  });

  // Add event listeners to the cluster tabs that highlight the active tab and show the corresponding code tabs
  clusterTabs.forEach((clusterTab, clusterIndex) => {
    clusterTab.addEventListener('click', () => {
      console.log(`Cluster ${clusterIndex} clicked`)
      clusterTabs.forEach((t) => t.classList.remove('active'));
      clusterTab.classList.add('active');

      allCodeTabs.forEach((t) => t.style.display = 'none');
      const codeTabs = allCodeTabs.get(clusterIndex);
      if (codeTabs) {
        codeTabs.style.display = 'flex';
      }
    });
  });

  const widget = new Widget({ node: mainContainer });
  layout?.insertWidget(0, widget);
};
/**
 * Initialization data for the jupyterlab_hide_code extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_hide_code:plugin',
  description:
    'A button in JupyterLab to run the code cells and then to hide the code cells.',
  autoStart: 'defer',
  activate: (app: JupyterFrontEnd) => {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
    console.log('JupyterLab extension jupyterlab_hide_code is activated!');
  }
};

export class ButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const showClusters = () => {

      panel.content.widgets.forEach((cell) => {

        createClusters(cell, cell.model.metadata['codes'] as unknown as Code[]);
      });

      buttonShowInput.show();
    };

    const buttonShowInput = new ToolbarButton({
      className: 'myButton',
      iconClass: 'fa fa-sm fa-eye fontawesome-colors',
      onClick: showClusters,
      tooltip: 'Show Input'
    });

    buttonShowInput.show();
    panel.toolbar.insertItem(11, 'showInput', buttonShowInput);



    return new DisposableDelegate(() => {
      buttonShowInput.dispose();
    });
  }
}

export default plugin;