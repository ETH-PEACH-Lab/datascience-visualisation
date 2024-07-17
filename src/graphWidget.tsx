/* eslint-disable @typescript-eslint/naming-convention */
// src/Flowchart.tsx

import React, { useRef, useEffect, useState } from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';
import * as d3 from 'd3';
import { NotebookManager } from './helper';
import { getClassColor } from './helper';

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

type Props = { notebookManager: NotebookManager };
const Flowchart: React.FC<Props> = (prop) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedNotebook, setSelectedNotebook] = useState<string>('');

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', 300)
      .attr('height', 600);

    svg.selectAll('*').remove(); // Clear existing graph

    const notebookClasses = prop.notebookManager.getCellsClass(parseInt(selectedNotebook));
    const nodes: Node[] = [];
    const nodesSet = new Set<string>();
    const links: Link[] = [];
    let nodeCounter = 0;
    for(let i = 0; i < notebookClasses.length; i++) {
      if (!nodesSet.has(notebookClasses[i])) {
        nodes.push({ id: notebookClasses[i], x: 100, y: 50 + (nodeCounter++) * 100 });
        nodesSet.add(notebookClasses[i]);
      }
      if (i < notebookClasses.length - 1 && notebookClasses[i] !== notebookClasses[i + 1]) {
        links.push({ source: notebookClasses[i], target: notebookClasses[i + 1], weight: 1 });
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
      .attr('fill', d => getClassColor(d.id));

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
  }, [selectedNotebook]);

  const handleNotebookChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    setSelectedNotebook(selected);
    prop.notebookManager.showNotebook(parseInt(selected));
  }

  return (
    <div>
      <select value={selectedNotebook} onChange={handleNotebookChange}>
        {prop.notebookManager.getNotebookIds().map(notebook => (
          <option key={notebook} value={notebook}>
            {notebook}
          </option>
        ))}
      </select>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export class FlowchartWidget extends ReactWidget {


  notebookManager: NotebookManager;
  /**
   * Constructs a new CounterWidget.
   */
  constructor(notebookManager: NotebookManager) {
    super();
    this.addClass('jp-react-widget');
    this.notebookManager = notebookManager;
  }

  render(): JSX.Element {
    return <Flowchart notebookManager={this.notebookManager} />;
  }
}
