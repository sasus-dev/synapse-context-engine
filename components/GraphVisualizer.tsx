
import React, { useEffect, useRef, useMemo } from 'react';
import { KnowledgeGraph, Node, ActivatedNode } from '../types';
import * as d3 from 'd3-force';
import * as d3Drag from 'd3-drag';
import * as d3Zoom from 'd3-zoom';
import * as d3Selection from 'd3-selection';

interface GraphVisualizerProps {
  graph: KnowledgeGraph;
  activatedNodes: ActivatedNode[];
  onNodeClick?: (id: string) => void;
  selectedNodeId?: string | null;
  heatmapMode?: boolean;
  fitTrigger?: number;
  physics?: { gravity: number; repulsion: number; linkDist: number };
  searchQuery?: string;
  isolateMode?: boolean;
  historyMode?: boolean;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  graph, activatedNodes, onNodeClick, selectedNodeId = null, heatmapMode = false, fitTrigger = 0,
  physics = { gravity: 0.08, repulsion: 1500, linkDist: 220 },
  searchQuery = '', isolateMode = false, historyMode = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<any[]>([]);
  const transformRef = useRef<any>(d3Zoom.zoomIdentity);
  const zoomRef = useRef<any>(null);

  // Physics Simulation
  const simulation = useMemo(() => {
    return d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => d.id).distance(physics.linkDist).strength(0.2))
      .force("charge", d3.forceManyBody().strength(-physics.repulsion).distanceMax(2500))
      .force("center", d3.forceCenter(0, 0).strength(0.05))
      .force("collision", d3.forceCollide().radius((d: any) => (d.heat || 0) * 20 + 60).strength(1)) // Enhanced Collision
      .force("x", d3.forceX(0).strength(physics.gravity))
      .force("y", d3.forceY(0).strength(physics.gravity))
      .velocityDecay(0.35);
  }, []);

  // Physics Updates
  useEffect(() => {
    if (!simulation) return;
    simulation.force("charge", d3.forceManyBody().strength(-physics.repulsion).distanceMax(2500));
    simulation.force("x", d3.forceX(0).strength(physics.gravity));
    simulation.force("y", d3.forceY(0).strength(physics.gravity));
    (simulation.force("link") as any).distance(physics.linkDist);
    simulation.alpha(0.3).restart();
  }, [physics, simulation]);

  // Data Sync & Filtering
  const nodes = useMemo(() => {
    let rawNodes = (Object.values(graph.nodes) as Node[]);

    // History Mode Filter
    if (historyMode) {
      rawNodes = rawNodes.filter(n => n.isNew);
    }

    return rawNodes.map(n => {
      const existing = nodesRef.current.find(en => en.id === n.id);
      return existing ? { ...n, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy } : { ...n };
    });
  }, [graph.nodes, historyMode]);

  const links = useMemo(() => {
    // Filter links to only include those present in the filtered nodes list
    const nodeIds = new Set(nodes.map(n => n.id));
    return graph.synapses
      .filter(s => nodeIds.has(s.source) && nodeIds.has(s.target))
      .map(s => ({ source: s.source, target: s.target, weight: s.weight, type: s.type }));
  }, [graph.synapses, nodes]);

  useEffect(() => {
    nodesRef.current = nodes;
    simulation.nodes(nodes as any);
    (simulation.force("link") as any).links(links);
    simulation.alpha(0.8).restart();
  }, [nodes, links, simulation]);

  // Recenter / Fit View Logic
  useEffect(() => {
    if (fitTrigger > 0 && canvasRef.current && zoomRef.current && nodesRef.current.length > 0) {
      const canvas = canvasRef.current;
      const currentNodes = nodesRef.current; // Use current ref

      if (currentNodes.length === 0) return;

      const padding = 100;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      currentNodes.forEach(n => {
        if (n.x === undefined || n.y === undefined) return;
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x);
        maxY = Math.max(maxY, n.y);
      });

      // If single node or tight cluster, enforce min size
      if (maxX - minX < 100) { minX -= 50; maxX += 50; }
      if (maxY - minY < 100) { minY -= 50; maxY += 50; }

      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const scale = Math.min(1.5, 0.9 / Math.max(width / canvas.width, height / canvas.height));

      // Reset to Identity first then translate/scale
      const transform = d3Zoom.zoomIdentity
        .translate(canvas.width / 2, canvas.height / 2)
        .scale(scale)
        .translate(-midX, -midY);

      d3Selection.select(canvas).transition().duration(800).call(zoomRef.current.transform, transform);
    }
  }, [fitTrigger]);

  // Zoom / Drag Setup (unchanged logic mostly, ensuring ref is kept)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoom = d3Zoom.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
      });

    zoomRef.current = zoom;
    d3Selection.select(canvas).call(zoom as any);

    const drag = d3Drag.drag()
      .container(canvas)
      .subject((event) => {
        const transform = transformRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = transform.invertX(event.x - rect.width / 2);
        const y = transform.invertY(event.y - rect.height / 2);
        // Larger grab radius
        return nodesRef.current.find(n => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 40);
      })
      .on("start", (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event) => {
        const transform = transformRef.current;
        // Correct drag coordinates accounting for transform
        // Note: d3-drag with canvas + zoom is tricky. 
        // We use the event.x/y explicitly which d3 calculates nicely relative to container if configured right
        const relativeX = transform.invertX(event.x - canvas.width / 2);
        const relativeY = transform.invertY(event.y - canvas.height / 2);
        event.subject.fx = relativeX;
        event.subject.fy = relativeY;
      })
      .on("end", (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });

    d3Selection.select(canvas).call(drag as any);
  }, [simulation]);

  // Click Handler
  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !onNodeClick) return;
    const rect = canvas.getBoundingClientRect();
    const transform = transformRef.current;
    const x = transform.invertX(e.clientX - rect.left - rect.width / 2);
    const y = transform.invertY(e.clientY - rect.top - rect.height / 2);
    const clicked = nodesRef.current.find(n => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 40);
    if (clicked) onNodeClick(clicked.id);
  };

  // RENDER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      // Resize if needed
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const transform = transformRef.current;
      ctx.translate(canvas.width / 2 + transform.x, canvas.height / 2 + transform.y);
      ctx.scale(transform.k, transform.k);

      const time = Date.now() / 1000;

      // Draw Links
      links.forEach((link: any) => {
        const s = link.source; const t = link.target;
        if (!s || !t || s.x === undefined || t.x === undefined) return;

        // Dimming Logic
        let alpha = 1;
        if (isolateMode && selectedNodeId) {
          const isConnected = s.id === selectedNodeId || t.id === selectedNodeId;
          if (!isConnected) alpha = 0.05;
        } else if (searchQuery) {
          // Links dim if neither node matches? Or strict? 
          // Lets Keep links visible if both nodes visible
          const sMatch = s.label.toLowerCase().includes(searchQuery.toLowerCase());
          const tMatch = t.label.toLowerCase().includes(searchQuery.toLowerCase());
          if (!sMatch && !tMatch) alpha = 0.05;
        }

        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        const sourceAct = activatedNodes.find(a => a.node === (typeof s === 'object' ? s.id : s));
        const targetAct = activatedNodes.find(a => a.node === (typeof t === 'object' ? t.id : t));
        const isActive = sourceAct && targetAct;

        ctx.lineWidth = 1 + link.weight * 4 + (isActive ? 3 : 0);
        ctx.strokeStyle = heatmapMode
          ? `rgba(139, 92, 246, ${0.03 + link.weight * 0.15})`
          : isActive ? `rgba(167, 139, 250, 0.7)` : `rgba(139, 92, 246, 0.15)`;

        ctx.stroke();

        if (isActive && alpha > 0.1) {
          const particleCount = 2;
          for (let i = 0; i < particleCount; i++) {
            const progress = (time * 0.6 + (i / particleCount)) % 1.0;
            const px = s.x + (t.x - s.x) * progress;
            const py = s.y + (t.y - s.y) * progress;
            ctx.beginPath();
            ctx.arc(px, py, 2.5 * alpha, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      });

      // Draw Nodes
      nodesRef.current.forEach((node: any) => {
        const act = activatedNodes.find(a => a.node === node.id);
        const energy = act ? act.energy : 0;
        const isSelected = selectedNodeId === node.id;

        // Visibility Logic
        let alpha = 1;
        let isHighlighted = false;

        if (isolateMode && selectedNodeId) {
          // Check neighbors
          const isNeighbor = links.some((l: any) =>
            (l.source.id === selectedNodeId && l.target.id === node.id) ||
            (l.target.id === selectedNodeId && l.source.id === node.id)
          );
          if (node.id !== selectedNodeId && !isNeighbor) alpha = 0.1;
        }

        if (searchQuery) {
          if (node.label.toLowerCase().includes(searchQuery.toLowerCase())) {
            isHighlighted = true;
            alpha = 1; // Force visible
          } else {
            if (!isolateMode) alpha = 0.1; // Dim unless already dimmed by isolate
          }
        }

        const baseH = 240 - (node.heat * 240);
        const radius = (heatmapMode ? 20 + node.heat * 25 : 30 + node.heat * 15) + (energy * 50) + (isSelected ? 8 : 0);

        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

        if (heatmapMode) {
          const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 1.8);
          grad.addColorStop(0, `hsla(${baseH}, 100%, 50%, 0.7)`);
          grad.addColorStop(1, `hsla(${baseH}, 100%, 50%, 0)`);
          ctx.fillStyle = grad;
          ctx.fill();
        } else {
          const l = 35 + (node.heat * 25) + (energy * 30);
          const color = `hsla(${baseH}, 80%, ${l}%, 1)`;
          ctx.fillStyle = color;

          if (isHighlighted) {
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#fbbf24'; // Amber glow
          } else {
            ctx.shadowBlur = isSelected ? 60 : act ? 30 + energy * 30 : 0;
            ctx.shadowColor = isSelected ? '#ffffff' : '#8b5cf6';
          }

          ctx.strokeStyle = isSelected ? '#ffffff' : act ? '#ffffff' : 'rgba(255,255,255,0.1)';
          ctx.lineWidth = isSelected ? 6 : act ? 3 : 1.5;
          ctx.fill();
          ctx.stroke();
        }

        // Labels
        if ((!heatmapMode || isSelected || energy > 0.4 || isHighlighted) && alpha > 0.2) {
          const fontSize = (isSelected ? 20 : 14) / transform.k;
          ctx.font = `900 ${fontSize}px Inter`;
          ctx.fillStyle = isHighlighted ? '#fbbf24' : '#ffffff';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 8; ctx.shadowColor = 'black';
          ctx.fillText(node.label, node.x, node.y + radius + (25 / transform.k));
        }

        ctx.globalAlpha = 1;
      });
      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animFrameId);
  }, [links, activatedNodes, selectedNodeId, heatmapMode, isolateMode, searchQuery]);

  return (
    <div className="w-full h-full relative bg-[#02040a]">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" onClick={handleCanvasClick} />
    </div>
  );
};

export default GraphVisualizer;
