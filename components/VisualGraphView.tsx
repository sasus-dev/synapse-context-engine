import React, { useEffect, useRef, useState } from 'react';
import { Layers, Maximize2 } from 'lucide-react';
import * as d3Force from 'd3-force';
import * as d3Selection from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import * as d3Drag from 'd3-drag';

// D3 Aggregation
const d3 = {
    ...d3Force,
    ...d3Selection,
    ...d3Zoom,
    ...d3Drag,
};

interface VisualGraphViewProps {
    graph: any;
    activatedNodes: any[];
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
}

interface Node {
    id: string;
    label: string;
    type: 'concept' | 'entity' | 'event';
    heat?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    isNew?: boolean;
}

interface Link {
    source: string | Node;
    target: string | Node;
    weight: number;
}

const VisualGraphView: React.FC<VisualGraphViewProps> = ({ graph, activatedNodes, selectedNodeId, setSelectedNodeId }) => {
    // UI State
    const [heatmapMode, setHeatmapMode] = useState(false);
    const [viewType, setViewType] = useState<'STANDARD' | 'HEAT'>('STANDARD');

    // Controls
    const [searchQuery, setSearchQuery] = useState('');
    const [isolateMode, setIsolateMode] = useState(false);
    const [historyMode, setHistoryMode] = useState(false);

    // Physics
    const [gravity, setGravity] = useState(0.15);
    const [repulsion, setRepulsion] = useState(3000);
    const [linkDist, setLinkDist] = useState(300);

    // Canvas / D3 State
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Mutable State for Animation Loop
    const state = useRef({
        nodes: [] as Node[],
        links: [] as Link[],
        transform: d3.zoomIdentity,
        simulation: null as d3Force.Simulation<Node, Link> | null,
        width: 0,
        height: 0,
        colors: new Map<string, string>(),
        hoverNode: null as Node | null,
        zoomBehavior: null as any
    });

    // --- 1. Initialize Simulation & Listeners (Run Once) ---
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // Force Simulation
        state.current.simulation = d3.forceSimulation<Node, Link>()
            .force("center", d3.forceCenter(0, 0).strength(0.05))
            .force("charge", d3.forceManyBody().strength(-repulsion).distanceMax(3000))
            .force("collide", d3.forceCollide().radius((d: any) => 30 + (d.heat || 0) * 10).strength(1))
            .force("link", d3.forceLink<Node, Link>().id(d => d.id).distance(linkDist).strength(0.5))
            .force("x", d3.forceX(0).strength(gravity * 0.1))
            .force("y", d3.forceY(0).strength(gravity * 0.1))
            .velocityDecay(0.4)
            .on("tick", () => { }); // Tick handled in render loop

        // Zoom Behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                state.current.transform = event.transform;
            });
        state.current.zoomBehavior = zoom;

        d3.select(canvasRef.current).call(zoom as any)
            .on("dblclick.zoom", null);

        // Drag Behavior
        const drag = d3.drag<HTMLCanvasElement, unknown>()
            .subject((event) => {
                const transform = state.current.transform;
                const x = transform.invertX(event.x);
                const y = transform.invertY(event.y);

                let closest: Node | undefined;
                let minDist = Infinity;

                for (const n of state.current.nodes) {
                    if (n.x === undefined || n.y === undefined) continue;
                    const dx = x - n.x;
                    const dy = y - n.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < minDist && d2 < 1600) {
                        minDist = d2;
                        closest = n;
                    }
                }
                return closest;
            })
            .on("start", (event) => {
                if (!event.subject) return;
                if (!event.active) state.current.simulation?.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on("drag", (event) => {
                if (!event.subject) return;
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on("end", (event) => {
                if (!event.subject) return;
                if (!event.active) state.current.simulation?.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            });

        d3.select(canvasRef.current).call(drag);

        // Click interaction
        d3.select(canvasRef.current).on("click", (event) => {
            const transform = state.current.transform;
            const [mx, my] = d3.pointer(event);
            const x = transform.invertX(mx);
            const y = transform.invertY(my);

            const clicked = state.current.nodes.find(n => {
                if (n.x === undefined || n.y === undefined) return false;
                return Math.hypot(n.x - x, n.y - y) < (30 + (n.heat || 0) * 5);
            });

            if (clicked) setSelectedNodeId(clicked.id);
        });

        // Hover interaction
        d3.select(canvasRef.current).on("mousemove", (event) => {
            const transform = state.current.transform;
            const [mx, my] = d3.pointer(event);
            const x = transform.invertX(mx);
            const y = transform.invertY(my);

            const hovered = state.current.nodes.find(n => {
                if (n.x === undefined || n.y === undefined) return false;
                return Math.hypot(n.x - x, n.y - y) < (30 + (n.heat || 0) * 5);
            });
            state.current.hoverNode = hovered || null;
            if (canvasRef.current) canvasRef.current.style.cursor = hovered ? 'pointer' : 'move';
        });

        // Resize Observer
        const resizeObs = new ResizeObserver(entries => {
            if (!entries[0]) return;
            const { width, height } = entries[0].contentRect;
            if (width === 0 || height === 0) return;

            state.current.width = width;
            state.current.height = height;
            if (canvasRef.current) {
                canvasRef.current.width = width;
                canvasRef.current.height = height;
                // Center initial view if needed
                const t = d3.zoomIdentity.translate(width / 2, height / 2).scale(1);
                d3.select(canvasRef.current).call(zoom.transform as any, t);
            }
        });
        resizeObs.observe(containerRef.current);

        return () => {
            state.current.simulation?.stop();
            resizeObs.disconnect();
        };
    }, []);

    // --- 2. Update Physics ---
    useEffect(() => {
        const sim = state.current.simulation;
        if (!sim) return;
        sim.force("charge", d3.forceManyBody().strength(-repulsion).distanceMax(5000));
        (sim.force("link") as any).distance(linkDist).strength(0.5);
        sim.force("x", d3.forceX(0).strength(gravity * 0.1));
        sim.force("y", d3.forceY(0).strength(gravity * 0.1));
        sim.alpha(0.3).restart();
    }, [gravity, repulsion, linkDist]);

    // --- 3. Update Data (Nodes/Links) ---
    useEffect(() => {
        if (!state.current.simulation || !graph) return;

        const rawNodes = Object.values(graph.nodes) as Node[];
        const currentNodesMap = new Map(state.current.nodes.map(n => [n.id, n]));

        // Merge Nodes (keep pos)
        const newNodes = rawNodes.map(n => {
            const existing = currentNodesMap.get(n.id);
            // Check if new (not in previous map)
            const isNew = existing ? (existing.isNew || false) : true;

            return {
                ...n,
                x: existing?.x ?? (Math.random() - 0.5) * 1000,
                y: existing?.y ?? (Math.random() - 0.5) * 1000,
                vx: existing?.vx || 0,
                vy: existing?.vy || 0,
                isNew // Track for History Mode
            };
        });

        // Reset isNew flag after 5 seconds? 
        // For now, let's keep them 'New' so History Mode shows them as 'Added' since start.
        // Or if user toggles History, it shows "What has been added recently". 
        // Actually, let's make sure `isNew` persists for the session.

        const nodeIds = new Set(newNodes.map(n => n.id));
        const newLinks = (graph.synapses || []).filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target))
            .map((l: any) => ({ ...l }));

        state.current.nodes = newNodes;
        state.current.links = newLinks;

        // Viral Coloring
        const colors = new Map<string, string>();
        const incoming = new Map<string, number>();
        newLinks.forEach(l => {
            const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
            incoming.set(t, (incoming.get(t) || 0) + 1);
        });

        const PALETTE = ['#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#f472b6'];
        const roots = newNodes.filter(n => (incoming.get(n.id) || 0) === 0 || n.type === 'concept');
        if (roots.length === 0 && newNodes.length > 0) roots.push(newNodes[0]);

        roots.forEach((r, i) => colors.set(r.id, PALETTE[i % PALETTE.length]));

        // BFS Propagate
        const queue = [...roots];
        const visited = new Set(roots.map(r => r.id));
        while (queue.length > 0) {
            const curr = queue.shift()!;
            const c = colors.get(curr.id);
            if (!c) continue;

            const children = newLinks.filter(l => {
                const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
                return s === curr.id;
            }).map(l => {
                const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
                return newNodes.find(n => n.id === t);
            });

            children.forEach(child => {
                if (child && !visited.has(child.id)) {
                    colors.set(child.id, c);
                    visited.add(child.id);
                    queue.push(child);
                }
            });
        }
        state.current.colors = colors;

        // Update Sim
        state.current.simulation.nodes(state.current.nodes);
        (state.current.simulation.force("link") as any).links(state.current.links);
        state.current.simulation.alpha(1).restart();

    }, [graph]);

    // --- Helper: Heatmap Color ---
    const getHeatColor = (t: number) => {
        // Simple distinct gradient: Blue (low) -> Cyan -> Yellow -> Red (high)
        if (t < 0.25) return `rgb(${0}, ${Math.round(t * 4 * 255)}, ${255})`; // Blue -> Cyan
        if (t < 0.5) return `rgb(${0}, ${255}, ${Math.round((1 - (t - 0.25) * 4) * 255)})`; // Cyan -> Greenish
        if (t < 0.75) return `rgb(${Math.round((t - 0.5) * 4 * 255)}, ${255}, ${0})`; // Green -> Yellow
        return `rgb(${255}, ${Math.round((1 - (t - 0.75) * 4) * 255)}, ${0})`; // Yellow -> Red
    };

    // --- 4. Render Loop ---
    useEffect(() => {
        let rafId: number;
        const ctx = canvasRef.current?.getContext('2d');

        const render = () => {
            if (!ctx || !canvasRef.current) return;
            const { width, height } = canvasRef.current;
            const transform = state.current.transform;
            if (width === 0 || height === 0 || transform.k === 0) return;

            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(transform.x, transform.y);
            ctx.scale(transform.k, transform.k);

            // Animation Pulse
            const time = Date.now() / 500; // Speed
            const pulse = (Math.sin(time) + 1) / 2; // 0..1

            // Mode Filters
            let visibleNodeIds: Set<string> | null = null;
            if (isolateMode && selectedNodeId) {
                visibleNodeIds = new Set([selectedNodeId]);
                state.current.links.forEach(l => {
                    const s = (l.source as any).id;
                    const t = (l.target as any).id;
                    if (s === selectedNodeId) visibleNodeIds?.add(t);
                    if (t === selectedNodeId) visibleNodeIds?.add(s);
                });
            }
            const query = searchQuery.trim().toLowerCase();

            // --- LAYER 1: LINKS ---
            state.current.links.forEach(l => {
                const s = l.source as Node;
                const t = l.target as Node;
                if (!s.x || !s.y || !t.x || !t.y) return;

                // Mode Check
                const isVisible = (!visibleNodeIds || (visibleNodeIds.has(s.id) && visibleNodeIds.has(t.id)));

                ctx.globalAlpha = isVisible ? 0.2 : 0.02;
                ctx.lineWidth = 1.5 / transform.k;

                const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
                grad.addColorStop(0, state.current.colors.get(s.id) || '#64748b');
                grad.addColorStop(1, state.current.colors.get(t.id) || '#64748b');
                ctx.strokeStyle = grad;

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(t.x, t.y);
                ctx.stroke();
            });

            // --- LAYER 2: NODES ---
            state.current.nodes.forEach(n => {
                if (!n.x || !n.y) return;

                const isSelected = selectedNodeId === n.id;
                const isHover = state.current.hoverNode?.id === n.id;
                const matchesSearch = query ? n.label.toLowerCase().includes(query) : true;
                const isVisible = (!visibleNodeIds || visibleNodeIds.has(n.id)) && matchesSearch;

                // Base Sizes
                const heat = n.heat || 0;
                const baseR = heatmapMode ? (15 + heat * 25) : (20 + heat * 5);

                // Colors
                let color = state.current.colors.get(n.id) || '#94a3b8';
                if (heatmapMode) color = getHeatColor(heat);
                if (historyMode && n.isNew) color = '#22c55e'; // Green Override

                // Glow / Pulse
                // Pulse if: Selected, High Heat, or New
                const isPulsing = isSelected || (heatmapMode && heat > 0.7) || (historyMode && n.isNew);

                if (isPulsing || isHover) {
                    const glowSize = baseR + 8 + (isPulsing ? pulse * 5 : 0);

                    ctx.beginPath();
                    ctx.arc(n.x, n.y, glowSize, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.globalAlpha = isVisible ? (0.2 + (isPulsing ? pulse * 0.1 : 0)) : 0.05;
                    ctx.fill();
                }

                // Body
                ctx.beginPath();
                ctx.arc(n.x, n.y, baseR, 0, Math.PI * 2);
                ctx.fillStyle = '#09090b';
                ctx.globalAlpha = isVisible ? 1 : 0.1;
                ctx.fill();

                // Border
                ctx.lineWidth = (isSelected ? 3 : 1.5) / transform.k;
                ctx.strokeStyle = color;
                ctx.stroke();

                // Detail Dot
                if (isSelected || heat > 0.5) {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, baseR * 0.3, 0, Math.PI * 2);
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.fill();
                }
            });

            // --- LAYER 3: LABELS (Always On Top) ---
            state.current.nodes.forEach(n => {
                if (!n.x || !n.y) return;

                // Visibility Checks (Recalculated or could be cached, but cheap enough)
                const isSelected = selectedNodeId === n.id;
                const isHover = state.current.hoverNode?.id === n.id;
                const matchesSearch = query ? n.label.toLowerCase().includes(query) : true;
                const isVisible = (!visibleNodeIds || visibleNodeIds.has(n.id)) && matchesSearch;

                const heat = n.heat || 0;
                const baseR = heatmapMode ? (15 + heat * 25) : (20 + heat * 5);

                // Draw Conditions
                // 1. Always show if graph is small (< 15 nodes)
                // 2. Zoom level sufficient (> 0.35)
                // 3. Node is Selected or Hovered
                // 4. Heatmap Mode is ON and node is 'hot' (> 0.4)
                const isSmallGraph = state.current.nodes.length < 15;
                const showByZoom = transform.k > 0.35;
                const showByHeat = heatmapMode && heat > 0.4;

                if (isVisible && (isSmallGraph || showByZoom || isSelected || isHover || showByHeat)) {
                    ctx.font = `600 ${11 / transform.k}px 'Inter', sans-serif`;

                    // Label Content
                    let labelText = n.label;
                    if (heatmapMode && heat > 0) labelText += ` (${heat.toFixed(2)})`;

                    const h = (11 / transform.k) * 2.2;

                    // Position: Top of node + spacing
                    const lx = n.x;
                    const ly = n.y - baseR - (h * 0.5);

                    ctx.globalAlpha = 1;

                    // Text Shadow / Outline for readability without box
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Add shadow for glow effect
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 4;

                    // Thick dark outline
                    ctx.strokeStyle = '#020617';
                    ctx.lineWidth = 3 / transform.k;
                    ctx.lineJoin = 'round';
                    ctx.strokeText(labelText, lx, ly);

                    // Text Fill
                    ctx.fillStyle = isSelected ? '#a78bfa' : '#f8fafc';
                    ctx.fillText(labelText, lx, ly);

                    // Reset shadow for subsequent draws
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }
            });

            ctx.restore();
            rafId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(rafId);
    }, [selectedNodeId, isolateMode, searchQuery, heatmapMode, historyMode]);

    // --- Actions ---
    const handleFitView = () => {
        const nodes = state.current.nodes;
        if (nodes.length === 0 || !canvasRef.current || !state.current.zoomBehavior) return;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        nodes.forEach(n => {
            if (!n.x || !n.y) return;
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y);
        });

        if (minX === Infinity) return;

        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const dx = maxX - minX;
        const dy = maxY - minY;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        const scale = Math.min(2, 0.8 / Math.max(dx / width, dy / height));
        const t = d3.zoomIdentity.translate(width / 2, height / 2).scale(scale).translate(-midX, -midY);

        d3.select(canvasRef.current).transition().duration(750).call(state.current.zoomBehavior.transform, t);
    };


    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header / Controls */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-4 pl-2">
                    <div className="flex items-center gap-3">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span className="text-[12px] font-black uppercase text-white tracking-widest hidden sm:block">Neural Map</span>
                    </div>

                    {/* Search Input */}
                    <div className="relative group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH NODES..."
                            className="bg-black/40 border border-white/10 rounded-lg py-1.5 pl-3 pr-8 text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-purple-500 w-32 sm:w-48 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1.5 text-slate-500 hover:text-white">
                                <span className="text-xs">✕</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Physics Controls */}
                <div className="flex items-center gap-4 px-4 border-l border-white/10 hidden lg:flex">
                    <div className="flex flex-col gap-1 w-20">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Gravity</label>
                        <input type="range" min="0.01" max="0.3" step="0.01" value={gravity} onChange={(e) => setGravity(parseFloat(e.target.value))} className="h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                    </div>
                    <div className="flex flex-col gap-1 w-20">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Repulsion</label>
                        <input type="range" min="100" max="5000" step="50" value={repulsion} onChange={(e) => setRepulsion(parseFloat(e.target.value))} className="h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                    </div>
                    <div className="flex flex-col gap-1 w-20">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Link Dist</label>
                        <input type="range" min="50" max="600" step="10" value={linkDist} onChange={(e) => setLinkDist(parseFloat(e.target.value))} className="h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Mode Toggles */}
                    <button
                        onClick={() => setIsolateMode(!isolateMode)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isolateMode ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
                    >
                        Isolate
                    </button>

                    <button
                        onClick={() => setHistoryMode(!historyMode)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${historyMode ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
                    >
                        History
                    </button>

                    <div className="h-4 w-px bg-white/10 mx-1" />

                    <button
                        onClick={() => { setViewType('STANDARD'); setHeatmapMode(false); }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${viewType === 'STANDARD' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
                    >
                        Structural
                    </button>
                    <button
                        onClick={() => { setViewType('HEAT'); setHeatmapMode(true); }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${viewType === 'HEAT' ? 'bg-orange-600 border-orange-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
                    >
                        Heat
                    </button>
                    <button
                        onClick={handleFitView}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 bg-transparent border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative group"
            >
                <canvas ref={canvasRef} className="block w-full h-full" />
            </div>
        </div>
    );
};

export default VisualGraphView;
