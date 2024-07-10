/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable prettier/prettier */
/* eslint-disable prefer-const */
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
  code: string;
  notebook_id: number;
  cell_id: number;
  output: IOutput[];
}

interface CellMetadata {
  start_cell: boolean;
  class: string;
  codes: Code[];
}

/**
 * Change the code of a cell
 */
const changeCode = (cell: Cell<ICellModel>, code: Code) => {
  cell.model.sharedModel.setSource(code.code);
  const c = cell?.model.sharedModel as unknown as ISharedCodeCell;
  c.execution_count = code.cell_id;
  // console.log('Setting outputs', code.output);
  // c.setOutputs(code.output);
};



const classes = [
  { label: 'Data Extraction', color: '#6abf4b' }, // Green
  { label: 'Data Transform', color: '#4b98bf' }, // Blue
  { label: 'Visualization', color: '#bf4b4b' }, // Red
  { label: 'Debug', color: '#bf4b98' }, // Pink
  { label: 'Model Training', color: '#bfb24b' }, // Yellow
];

const changeAllCells = (cells: readonly Cell<ICellModel>[], notebook_id: number) => {
  cells.forEach((cell) => {
    const cellMeta = cell.model.metadata as unknown as CellMetadata;
    cell.hide();
    cellMeta.codes.forEach((code) => {
      if (code.notebook_id === notebook_id) {
        cell.show();
        console.log('Changing code', code);
        changeCode(cell, code);
      }
    });
  });
}

const createClass = (cells: readonly Cell<ICellModel>[], cell: Cell<ICellModel>, cellMeta: CellMetadata) => {
  if (!cellMeta.start_cell) {
    return;
  }
  const classContainer = document.createElement('div');
  classContainer.className = 'cells-class';

  const classHeader = document.createElement('div');
  classHeader.className = 'class-header';
  classHeader.innerText = cellMeta.class;
  classHeader.style.backgroundColor = classes.find((c) => c.label === cellMeta.class)?.color as string;

  classContainer.appendChild(classHeader);


  const studentContainer = document.createElement('div');
  studentContainer.className = 'class-tabs';
  classContainer.appendChild(studentContainer);

  cellMeta.codes.forEach((code) => {
    console.log('Creating code ', code.notebook_id);
    const codeDiv = document.createElement('div');
    codeDiv.className = 'student-tab';
    codeDiv.innerText = code.notebook_id.toString();
    codeDiv.style.borderColor = classes.find((c) => c.label === cellMeta.class)?.color as string;
    studentContainer.appendChild(codeDiv);

    codeDiv.addEventListener('click', () => {
      changeAllCells(cells, code.notebook_id);
      console.log('Changing to ', code.notebook_id);
      document.querySelectorAll('.student-tab').forEach((tab) => {
        const tabElement = tab as HTMLElement;
        if (parseInt(tabElement.innerText) === code.notebook_id) {
          tabElement.classList.add('active');
        } else {
          tabElement.classList.remove('active');
        }
      });
    });
  });

  const widget = new Widget({ node: classContainer });
  const layout = cell.layout as unknown as PanelLayout;
  layout?.insertWidget(0, widget);
};

/**
 * Initialization data for the sidebar and cluster extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sidebar-cluster:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {

    // Add the button extension to the notebook
    app.docRegistry.addWidgetExtension('Notebook', new SideBarExtension(app));
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
  }
};

export class SideBarExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

    private app: JupyterFrontEnd;

    constructor(app: JupyterFrontEnd) {
      this.app = app;
    }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
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
    this.app.shell.add(sidebar, 'left');

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
    
    return new DisposableDelegate(() => {
      sidebar.dispose();
    });
  }
}

export class ButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const showClusters = () => {
      console.log('Showing clusters');
      panel.content.widgets.forEach((cell) => {

        createClass(panel.content.widgets, cell, cell.model.metadata as unknown as CellMetadata);
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
