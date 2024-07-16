/* eslint-disable @typescript-eslint/naming-convention */
// src/Flowchart.tsx

import React, { useRef, useEffect } from 'react';
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
}

const Flowchart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', 300)
      .attr('height', 600);

    const data: Node[] = [
      { id: 'Data Extraction', x: 50, y: 50 },
      { id: 'Data Transform', x: 50, y: 150 },
      { id: 'Visualization', x: 50, y: 250 },
      { id: 'Debug', x: 50, y: 350 },
      { id: 'Model Training', x: 50, y: 450 }
    ];

    const links: Link[] = [
      { source: 'Data Extraction', target: 'Data Transform' },
      { source: 'Data Transform', target: 'Visualization' },
      { source: 'Visualization', target: 'Debug' },
      { source: 'Debug', target: 'Model Training' },
    ];

    const nodeWidth = 120;
    const nodeHeight = 50;

    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', d => {
        switch (d.id) {
          case 'Data Extraction': return '#d1e7dd';
          case 'Data Transform': return '#c8d6c2';
          case 'Visualization': return '#d7c6a1';
          case 'Debug': return '#d6b8b7';
          case 'Model Training': return '#c7a39b';
          default: return '#ccc';
        }
      });

    svg.selectAll('text')
      .data(data)
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
        const source = data.find(node => node.id === d.source);
        const target = data.find(node => node.id === d.target);
        if (source && target) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          return lineGenerator([
            [source.x, source.y + nodeHeight / 2],
            [midX - nodeWidth/2, midY],
            [target.x, target.y + nodeHeight / 2]
          ] as [number, number][]);
        }
        return '';
      })
      .attr('stroke', '#999')
      .attr('fill', 'none');
  }, []);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export class FlowchartWidget extends ReactWidget {
  /**
   * Constructs a new CounterWidget.
   */
  constructor() {
    super();
    this.addClass('jp-react-widget');
  }

  render(): JSX.Element {
    return <Flowchart />;
  }
}
