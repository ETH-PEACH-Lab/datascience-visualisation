/* eslint-disable @typescript-eslint/naming-convention */
import React, { Component, createRef } from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';
import * as d3 from 'd3';

interface Node {
  id: string;
  x: number;
  y: number;
}

interface Link {
  source: string;
  target: string;
  weight: number;
}

interface NotebookCell {
  cell_id: number;
  code: string;
  class: string;
}

interface Props {}

interface State {
  selectedCells: NotebookCell[];
}

class Flowchart extends Component<Props, State> {
  svgRef: React.RefObject<SVGSVGElement>;

  constructor(props: Props) {
    super(props);
    this.svgRef = createRef();
    this.state = {
      selectedCells: [],
    };
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.selectedCells !== this.state.selectedCells) {
      this.drawChart();
    }
  }

  updateSelectedCells = (newSelectedCells: NotebookCell[]) => {
    this.setState({ selectedCells: newSelectedCells });
  };

  drawChart() {
    const { selectedCells } = this.state;
    console.log('Drawing chart for selected cells', selectedCells);
    if (selectedCells.length === 0) {
      return;
    }

    const svg = d3.select(this.svgRef.current)
      .attr('width', 300)
      .attr('height', 600);

    svg.selectAll('*').remove(); // Clear existing graph

    // Extract unique classes from selected cells
    const classes = selectedCells.map(cell => cell.class);
    const nodes: Node[] = [];
    const nodesSet = new Set<string>();
    const links: Link[] = [];
    let nodeCounter = 0;

    for (let i = 0; i < classes.length; i++) {
      if (!nodesSet.has(classes[i])) {
        nodes.push({ id: classes[i], x: 100, y: 50 + (nodeCounter++) * 100 });
        nodesSet.add(classes[i]);
      }
      if (i < classes.length - 1 && classes[i] !== classes[i + 1]) {
        links.push({ source: classes[i], target: classes[i + 1], weight: 1 });
      }
    }

    const nodeWidth = 120;
    const nodeHeight = 50;

    svg.selectAll('rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', '#69b3a2'); // Replace with your color logic

    svg.selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('x', d => d.x + nodeWidth / 2)
      .attr('y', d => d.y + nodeHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(d => d.id);

    const lineGenerator = d3.line()
      .curve(d3.curveBundle.beta(0.5));

    svg.selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', d => {
        const source = nodes.find(node => node.id === d.source);
        const target = nodes.find(node => node.id === d.target);
        if (source && target) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          return lineGenerator([
            [source.x, source.y + nodeHeight / 2],
            [midX - nodeWidth / 2, midY],
            [target.x, target.y + nodeHeight / 2]
          ] as [number, number][]);
        }
        return '';
      })
      .attr('stroke', '#999')
      .attr('fill', 'none');
  }

  render() {
    return (
      <div>
        <svg ref={this.svgRef}></svg>
      </div>
    );
  }
}

export class FlowchartWidget extends ReactWidget {
  graph: React.RefObject<Flowchart>;

  constructor() {
    super();
    this.addClass('jp-react-widget');
    this.graph = createRef();
  }
  
  public updateGraph(selectedCells: NotebookCell[]): void {
    this.graph.current?.updateSelectedCells(selectedCells);
  }

  render(): JSX.Element {
    return <Flowchart ref={this.graph} />;
  }
}
