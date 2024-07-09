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
 * Initialization data for the sidebar and cluster extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sidebar-cluster:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension sidebar-cluster is activated!');

    // Create a sidebar widget
    const sidebar = new Widget();
    sidebar.id = 'sidebar';
    sidebar.title.iconClass = 'jp-SideBarIcon jp-SideBar';
    sidebar.title.caption = 'Flowchart Sidebar';
    sidebar.node.innerHTML = `
      <div class="sidebar-content">
        <select id="viewSelector">
          <option value="all">ALL</option>
          <option value="student1">Student 1</option>
          <option value="student2">Student 2</option>
          <option value="student3">Student 3</option>
        </select>
        <div class="node node1" id="node1">Data Extraction</div>
        <div class="node node2" id="node2">Data Transform</div>
        <div class="node node3" id="node3">Visualization</div>
        <div class="node node4" id="node4">Debug</div>
        <div class="node node5" id="node5">Model Training</div>
        <div class="student-graph" id="student-graph" style="display: none;">
          <div class="student-node" id="student-node1">Node 1</div>
          <div class="student-node" id="student-node2">Node 2</div>
          <div class="student-node" id="student-node3">Node 3</div>
          <div class="student-node" id="student-node4">Node 4</div>
          <div class="student-node" id="student-node5">Node 5</div>
        </div>
        <svg class="edges" height="800" width="200">
          <!-- Define edges here -->
        </svg>
      </div>
    `;

    // Add the sidebar to the left area
    app.shell.add(sidebar, 'left');

    const svgEdges = sidebar.node.querySelector('.edges') as SVGElement;
    const viewSelector = sidebar.node.querySelector('#viewSelector') as HTMLSelectElement;

    const drawEdges = () => {
      const svgRect = svgEdges.getBoundingClientRect();
      svgEdges.innerHTML = ''; // Clear previous edges

      const connections = [
        { start: 'node1', end: 'node2', width: '5' },
        { start: 'node1', end: 'node3', width: '10' },
        { start: 'node1', end: 'node4', width: '1' },
        { start: 'node2', end: 'node3', width: '3' },
        { start: 'node3', end: 'node4', width: '3' },
        { start: 'node3', end: 'node5', width: '5' },
        { start: 'node4', end: 'node5', width: '6' }
      ];

      const studentConnections = [
        { start: 'student-node1', end: 'student-node2', width: '2' },
        { start: 'student-node2', end: 'student-node3', width: '2' },
        { start: 'student-node3', end: 'student-node4', width: '2' },
        { start: 'student-node4', end: 'student-node5', width: '2' }
      ];

      connections.forEach(connection => {
        const startNode = sidebar.node.querySelector(`#${connection.start}`);
        const endNode = sidebar.node.querySelector(`#${connection.end}`);

        if (startNode && endNode) {
          const startNodeRect = startNode.getBoundingClientRect();
          const endNodeRect = endNode.getBoundingClientRect();

          const startX = startNodeRect.left + startNodeRect.width / 2 - svgRect.left;
          const startY = startNodeRect.top + startNodeRect.height / 2 - svgRect.top;
          const endX = endNodeRect.left + endNodeRect.width / 2 - svgRect.left;
          const endY = endNodeRect.top + endNodeRect.height / 2 - svgRect.top;

          // Calculate control points for smoother curves
          const controlX1 = startX + (endX - startX) / 3;
          const controlY1 = startY;
          const controlX2 = endX - (endX - startX) / 3;
          const controlY2 = endY;

          const edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
          const pathData = `M${startX},${startY} C${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`;
          edge.setAttribute('d', pathData);
          edge.setAttribute('stroke', 'gray');
          edge.setAttribute('stroke-width', connection.width);
          edge.setAttribute('fill', 'none');
          svgEdges?.appendChild(edge);
        }
      });

      studentConnections.forEach(connection => {
        const startNode = sidebar.node.querySelector(`#${connection.start}`);
        const endNode = sidebar.node.querySelector(`#${connection.end}`);

        if (startNode && endNode) {
          const startNodeRect = startNode.getBoundingClientRect();
          const endNodeRect = endNode.getBoundingClientRect();

          const startX = startNodeRect.left + startNodeRect.width / 2 - svgRect.left;
          const startY = startNodeRect.top + startNodeRect.height / 2 - svgRect.top;
          const endX = endNodeRect.left + endNodeRect.width / 2 - svgRect.left;
          const endY = endNodeRect.top + endNodeRect.height / 2 - svgRect.top;

          // Calculate control points for smoother curves
          const controlX1 = startX + (endX - startX) / 3;
          const controlY1 = startY;
          const controlX2 = endX - (endX - startX) / 3;
          const controlY2 = endY;

          const edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
          const pathData = `M${startX},${startY} C${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`;
          edge.setAttribute('d', pathData);
          edge.setAttribute('stroke', 'gray');
          edge.setAttribute('stroke-dasharray', '4'); // Dashed line
          edge.setAttribute('stroke-width', connection.width);
          edge.setAttribute('fill', 'none');
          svgEdges?.appendChild(edge);
        }
      });
    };

    const updateView = () => {
      const selectedView = viewSelector.value;
      const allNodes = sidebar.node.querySelectorAll('.node');
      const studentGraph = sidebar.node.querySelector('#student-graph') as HTMLElement;

      if (selectedView === 'all') {
        allNodes.forEach(node => {
          node.classList.remove('hidden');
        });
        studentGraph.style.display = 'none';
      } else {
        allNodes.forEach(node => {
          node.classList.add('hidden');
        });
        studentGraph.style.display = 'block';
      }

      drawEdges();
    };

    viewSelector.addEventListener('change', updateView);

    // Use MutationObserver to redraw edges when nodes are rendered or resized
    const observer = new MutationObserver(() => {
      setTimeout(drawEdges, 100);
    });

    observer.observe(sidebar.node, {
      attributes: true,
      childList: true,
      subtree: true
    });

    // Draw edges initially
    setTimeout(drawEdges, 100);

    // Add the button extension to the notebook
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
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
