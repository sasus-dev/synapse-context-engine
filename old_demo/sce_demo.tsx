import React, { useState, useEffect } from 'react';
import { Play, Zap, Brain, Network, TrendingUp, Activity } from 'lucide-react';

const SCEDemo = () => {
  const [activeFocus, setActiveFocus] = useState('project_apollo');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [graph, setGraph] = useState(null);
  const [iteration, setIteration] = useState(0);
  const [weightChanges, setWeightChanges] = useState([]);
  const [showWeightMatrix, setShowWeightMatrix] = useState(false);

  // Mock graph data - nodes and synapses
  const initialGraph = {
    nodes: {
      // Projects
      project_apollo: { type: 'project', label: 'Apollo Redesign', heat: 0.9 },
      project_zeus: { type: 'project', label: 'Zeus Analytics', heat: 0.3 },
      
      // Documents
      doc_presentation: { type: 'document', label: 'Client Presentation', heat: 0.7 },
      doc_dashboard: { type: 'document', label: 'Performance Dashboard', heat: 0.8 },
      doc_guidelines: { type: 'document', label: 'Brand Guidelines', heat: 0.4 },
      doc_contract: { type: 'document', label: 'Contract Terms', heat: 0.2 },
      
      // Contacts
      contact_sarah: { type: 'contact', label: 'Sarah Chen (Design Lead)', heat: 0.6 },
      contact_john: { type: 'contact', label: 'John Smith (Client)', heat: 0.5 },
      contact_maria: { type: 'contact', label: 'Maria Rodriguez (PM)', heat: 0.4 },
      
      // Preferences/Behaviors
      pref_visual: { type: 'preference', label: 'Client Prefers Visual', heat: 0.5 },
      pref_minimal: { type: 'preference', label: 'Minimal Text Style', heat: 0.5 },
      behavior_quarterly: { type: 'behavior', label: 'Quarterly Comparison Pattern', heat: 0.3 },
      
      // Tools/Configs
      tool_figma: { type: 'tool', label: 'Figma Design', heat: 0.4 },
      config_template: { type: 'config', label: 'Presentation Template', heat: 0.6 },
    },
    
    synapses: [
      // Apollo project connections
      { source: 'project_apollo', target: 'doc_presentation', weight: 0.9, coActivations: 0 },
      { source: 'project_apollo', target: 'doc_dashboard', weight: 0.85, coActivations: 0 },
      { source: 'project_apollo', target: 'contact_sarah', weight: 0.8, coActivations: 0 },
      { source: 'project_apollo', target: 'contact_john', weight: 0.75, coActivations: 0 },
      { source: 'project_apollo', target: 'config_template', weight: 0.7, coActivations: 0 },
      
      // Document interconnections
      { source: 'doc_presentation', target: 'config_template', weight: 0.9, coActivations: 0 },
      { source: 'doc_presentation', target: 'pref_visual', weight: 0.8, coActivations: 0 },
      { source: 'doc_presentation', target: 'tool_figma', weight: 0.7, coActivations: 0 },
      { source: 'doc_presentation', target: 'behavior_quarterly', weight: 0.6, coActivations: 0 },
      
      { source: 'doc_dashboard', target: 'contact_sarah', weight: 0.7, coActivations: 0 },
      { source: 'doc_dashboard', target: 'doc_presentation', weight: 0.65, coActivations: 0 },
      { source: 'doc_dashboard', target: 'behavior_quarterly', weight: 0.8, coActivations: 0 },
      
      // Client preferences
      { source: 'contact_john', target: 'pref_visual', weight: 0.85, coActivations: 0 },
      { source: 'contact_john', target: 'pref_minimal', weight: 0.8, coActivations: 0 },
      { source: 'contact_john', target: 'doc_contract', weight: 0.6, coActivations: 0 },
      
      // Design lead connections
      { source: 'contact_sarah', target: 'tool_figma', weight: 0.9, coActivations: 0 },
      { source: 'contact_sarah', target: 'config_template', weight: 0.75, coActivations: 0 },
      { source: 'contact_sarah', target: 'doc_guidelines', weight: 0.7, coActivations: 0 },
      
      // Zeus project (for contrast)
      { source: 'project_zeus', target: 'contact_maria', weight: 0.8, coActivations: 0 },
      { source: 'project_zeus', target: 'doc_contract', weight: 0.6, coActivations: 0 },
    ]
  };

  useEffect(() => {
    setGraph(initialGraph);
  }, []);

  // Spreading activation algorithm
  const spreadingActivation = (seeds, maxDepth = 3, gamma = 0.8, theta = 0.3) => {
    if (!graph) return [];
    
    const activation = {};
    const visited = new Set();
    const paths = {};
    
    // Initialize seeds with energy 1.0
    seeds.forEach(seed => {
      activation[seed] = 1.0;
      paths[seed] = { depth: 0, path: [seed], energy: 1.0 };
    });
    
    // Build adjacency list
    const adjacency = {};
    graph.synapses.forEach(syn => {
      if (!adjacency[syn.source]) adjacency[syn.source] = [];
      adjacency[syn.source].push({ target: syn.target, weight: syn.weight });
    });
    
    // BFS-style propagation with depth limit
    const queue = seeds.map(s => ({ node: s, depth: 0, energy: 1.0, path: [s] }));
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      if (current.depth >= maxDepth) continue;
      if (visited.has(current.node + '_' + current.depth)) continue;
      visited.add(current.node + '_' + current.depth);
      
      const neighbors = adjacency[current.node] || [];
      
      neighbors.forEach(({ target, weight }) => {
        // Prevent cycles in path
        if (current.path.includes(target)) return;
        
        // Calculate propagated energy with decay
        const newEnergy = current.energy * weight * gamma;
        
        // Apply activation function (threshold + non-linearity)
        let activatedEnergy = 0;
        if (newEnergy >= theta) {
          activatedEnergy = (newEnergy - theta) / (1 + (newEnergy - theta));
        }
        
        if (activatedEnergy > 0) {
          // Take MAX energy if node reached via multiple paths
          if (!activation[target] || activation[target] < activatedEnergy) {
            activation[target] = activatedEnergy;
            paths[target] = {
              depth: current.depth + 1,
              path: [...current.path, target],
              energy: activatedEnergy
            };
          }
          
          // Continue propagation
          queue.push({
            node: target,
            depth: current.depth + 1,
            energy: activatedEnergy,
            path: [...current.path, target]
          });
        }
      });
    }
    
    // Sort by activation energy and apply heat bias
    const activated = Object.entries(activation)
      .map(([node, energy]) => ({
        node,
        energy,
        heat: graph.nodes[node]?.heat || 0,
        biasedEnergy: energy * (0.7 + 0.3 * (graph.nodes[node]?.heat || 0)),
        ...paths[node]
      }))
      .sort((a, b) => b.biasedEnergy - a.biasedEnergy);
    
    return activated;
  };

  // Information-theoretic pruning (MMR approximation)
  const pruneResults = (activated, query, maxResults = 10) => {
    if (activated.length === 0) return [];
    
    const selected = [];
    const candidates = [...activated];
    
    // Simple relevance scoring based on node type and labels
    const relevance = (node) => {
      const label = graph.nodes[node]?.label?.toLowerCase() || '';
      const queryLower = query.toLowerCase();
      const words = queryLower.split(' ');
      
      let score = 0;
      words.forEach(word => {
        if (label.includes(word)) score += 1;
      });
      
      return score > 0 ? score : 0.1; // Small base relevance
    };
    
    // Greedy MMR selection
    while (selected.length < maxResults && candidates.length > 0) {
      let bestIdx = 0;
      let bestGain = -Infinity;
      
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const rel = relevance(candidate.node);
        
        // Calculate redundancy with already selected
        let maxRedundancy = 0;
        selected.forEach(s => {
          // Simple redundancy: same type = higher redundancy
          const sameType = graph.nodes[s.node]?.type === graph.nodes[candidate.node]?.type;
          if (sameType) maxRedundancy = Math.max(maxRedundancy, 0.5);
        });
        
        const gain = (rel * candidate.biasedEnergy) / (1 + maxRedundancy);
        
        if (gain > bestGain) {
          bestGain = gain;
          bestIdx = i;
        }
      }
      
      selected.push(candidates[bestIdx]);
      candidates.splice(bestIdx, 1);
    }
    
    return selected;
  };

  // Extract entities from query (simple keyword matching)
  const extractEntities = (queryText) => {
    const entities = [];
    const lower = queryText.toLowerCase();
    
    Object.entries(graph.nodes).forEach(([id, node]) => {
      const label = node.label.toLowerCase();
      const words = label.split(' ');
      
      if (words.some(word => lower.includes(word))) {
        entities.push(id);
      }
    });
    
    return entities;
  };

  // Simulate weight learning (co-activation) with visible changes
  const updateWeights = (activatedNodes) => {
    const eta = 0.1; // Learning rate
    const updatedGraph = { ...graph };
    const changes = [];
    
    // Update weights between co-activated nodes
    for (let i = 0; i < activatedNodes.length; i++) {
      for (let j = i + 1; j < activatedNodes.length; j++) {
        const node1 = activatedNodes[i].node;
        const node2 = activatedNodes[j].node;
        
        // Find existing synapse
        let synapseFound = false;
        updatedGraph.synapses = updatedGraph.synapses.map(syn => {
          if ((syn.source === node1 && syn.target === node2) ||
              (syn.source === node2 && syn.target === node1)) {
            synapseFound = true;
            const oldWeight = syn.weight;
            const newWeight = Math.min(syn.weight + eta * (1 - syn.weight), 1.0);
            const delta = newWeight - oldWeight;
            
            if (delta > 0.001) { // Only track meaningful changes
              changes.push({
                from: graph.nodes[syn.source]?.label,
                to: graph.nodes[syn.target]?.label,
                oldWeight: oldWeight.toFixed(3),
                newWeight: newWeight.toFixed(3),
                delta: delta.toFixed(3),
                coActivations: syn.coActivations + 1
              });
            }
            
            return { ...syn, weight: newWeight, coActivations: syn.coActivations + 1 };
          }
          return syn;
        });
        
        // Create new synapse if doesn't exist
        if (!synapseFound) {
          const newWeight = 0.5 * eta; // Start small for new connections
          updatedGraph.synapses.push({
            source: node1,
            target: node2,
            weight: newWeight,
            coActivations: 1
          });
          
          changes.push({
            from: graph.nodes[node1]?.label,
            to: graph.nodes[node2]?.label,
            oldWeight: '0.000',
            newWeight: newWeight.toFixed(3),
            delta: newWeight.toFixed(3),
            coActivations: 1,
            isNew: true
          });
        }
      }
    }
    
    setGraph(updatedGraph);
    setIteration(iteration + 1);
    setWeightChanges(changes);
  };

  const handleQuery = () => {
    if (!query.trim() || !graph) return;
    
    // Step 1: Extract entities from query
    const entities = extractEntities(query);
    
    // Step 2: Create seeds (Active Focus + extracted entities)
    const seeds = [activeFocus, ...entities].filter((v, i, a) => a.indexOf(v) === i);
    
    // Step 3: Spreading activation
    const activated = spreadingActivation(seeds);
    
    // Step 4: Information-theoretic pruning
    const pruned = pruneResults(activated, query);
    
    // Step 5: Update weights based on co-activation
    updateWeights(pruned);
    
    setResults({
      seeds,
      entities,
      activated: activated.slice(0, 20),
      pruned,
      activeFocusNode: graph.nodes[activeFocus]
    });
  };

  // Get top synapses by weight for display
  const getTopSynapses = () => {
    if (!graph) return [];
    return [...graph.synapses]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15)
      .map(syn => ({
        ...syn,
        fromLabel: graph.nodes[syn.source]?.label,
        toLabel: graph.nodes[syn.target]?.label
      }));
  };

  const presetQueries = [
    "Update the client presentation with dashboard metrics",
    "What are the design guidelines?",
    "Who should I contact about this?",
    "Show me the quarterly comparison pattern"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold">Synapse Context Engine</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Associative memory through spreading activation & hypergraph topology
          </p>
          <div className="mt-2 flex items-center gap-4">
            <span className="text-sm text-purple-300">
              Iteration: <strong className="text-xl text-purple-400">{iteration}</strong>
            </span>
            <span className="text-sm text-yellow-300">
              Active Focus: <strong>{graph?.nodes[activeFocus]?.label}</strong>
            </span>
            <button
              onClick={() => setShowWeightMatrix(!showWeightMatrix)}
              className="text-sm bg-purple-600/30 hover:bg-purple-600/50 px-3 py-1 rounded border border-purple-500 transition-colors"
            >
              {showWeightMatrix ? 'Hide' : 'Show'} Weight Matrix
            </button>
          </div>
        </div>

        {/* Weight Matrix View */}
        {showWeightMatrix && (
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold">Live Synaptic Weight Matrix (Top 15)</h2>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getTopSynapses().map((syn, idx) => (
                <div key={idx} className="bg-slate-800/50 p-3 rounded border border-slate-600">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="text-cyan-300">{syn.fromLabel}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="text-cyan-300">{syn.toLabel}</span>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-mono">
                        <span className="text-purple-400">w: {syn.weight.toFixed(3)}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Co-activations: {syn.coActivations}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${syn.weight * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Focus Selector */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold">Active Focus (Persistent Context)</h2>
          </div>
          <select
            value={activeFocus}
            onChange={(e) => setActiveFocus(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white"
          >
            {graph && Object.entries(graph.nodes)
              .filter(([_, node]) => node.type === 'project')
              .map(([id, node]) => (
                <option key={id} value={id}>{node.label}</option>
              ))
            }
          </select>
        </div>

        {/* Query Interface */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Network className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Query (Triggers Spreading Activation)</h2>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="Ask something about your context..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white"
            />
            <button
              onClick={handleQuery}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              Activate
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {presetQueries.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(pq)}
                className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm transition-colors"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>

        {/* Results Display */}
        {results && (
          <div className="space-y-6">
            {/* Seeds */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-green-400">Step 1: Seeds (Initial Activation)</h3>
              <div className="flex flex-wrap gap-2">
                {results.seeds.map(seed => (
                  <div key={seed} className="bg-green-900/50 px-3 py-1 rounded border border-green-500">
                    {graph?.nodes[seed]?.label || seed}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Active Focus + Extracted Entities = {results.seeds.length} seed nodes
              </div>
            </div>

            {/* Activated Nodes */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Step 2: Spreading Activation (with Heat Bias)</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.activated.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/50 p-3 rounded border border-slate-600">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-blue-300">
                          {graph?.nodes[item.node]?.label}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Path: {item.path.map(n => graph?.nodes[n]?.label).join(' → ')}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm">
                          <span className="text-purple-400">Energy: {item.energy.toFixed(3)}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Heat: {item.heat.toFixed(2)} | Depth: {item.depth}
                        </div>
                        <div className="text-xs text-yellow-400">
                          Biased: {item.biasedEnergy.toFixed(3)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${item.biasedEnergy * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pruned Results */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-400">Step 3: Information-Theoretic Pruning (MMR)</h3>
              </div>
              <div className="space-y-2">
                {results.pruned.map((item, idx) => (
                  <div key={idx} className="bg-yellow-900/30 p-4 rounded border border-yellow-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-yellow-200">
                          #{idx + 1}: {graph?.nodes[item.node]?.label}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Type: {graph?.nodes[item.node]?.type} | Depth: {item.depth}
                        </div>
                      </div>
                      <div className="text-sm text-yellow-300">
                        Score: {item.biasedEnergy.toFixed(3)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-400 bg-slate-800/50 p-3 rounded">
                <strong>Context injected to LLM:</strong> {results.pruned.length} nodes selected via MMR 
                (relevance / redundancy), preserving token efficiency
              </div>
            </div>

            {/* Weight Changes - THIS IS NEW! */}
            {weightChanges.length > 0 && (
              <div className="bg-green-900/20 border-2 border-green-600 rounded-lg p-6 animate-pulse">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <Brain className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">Step 4: Hebbian Weight Updates (LIVE!)</h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {weightChanges.map((change, idx) => (
                    <div key={idx} className="bg-slate-800/70 p-3 rounded border border-green-500/50">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          {change.isNew && (
                            <span className="inline-block bg-green-600 text-xs px-2 py-1 rounded mr-2">NEW</span>
                          )}
                          <span className="text-green-300 font-semibold">{change.from}</span>
                          <span className="text-gray-400 mx-2">↔</span>
                          <span className="text-green-300 font-semibold">{change.to}</span>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-mono">
                            <span className="text-red-400">{change.oldWeight}</span>
                            <span className="text-gray-500 mx-2">→</span>
                            <span className="text-green-400">{change.newWeight}</span>
                          </div>
                          <div className="text-xs text-yellow-400">
                            Δ +{change.delta} | Co-acts: {change.coActivations}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-300 bg-slate-800/50 p-3 rounded">
                  <strong>Hebbian Learning:</strong> w(t+1) = w(t) + η·(1-w(t)) where η=0.1
                  <br />
                  <strong className="text-green-400">{weightChanges.length} synapses strengthened</strong> based on co-activation in this query.
                  The graph is self-organizing through usage!
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {!results && (
          <div className="bg-white/5 backdrop-blur rounded-lg p-8 border border-purple-500/30">
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">How It Works</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                <strong className="text-white">1. Active Focus:</strong> Sets persistent context (like "I'm working on Project Apollo"). 
                This anchors all queries without restating context.
              </p>
              <p>
                <strong className="text-white">2. Entity Extraction:</strong> Query is parsed to identify mentioned entities 
                (documents, people, tools, etc.).
              </p>
              <p>
                <strong className="text-white">3. Spreading Activation:</strong> Energy propagates from seeds through the graph. 
                Strong synapses (high weights) conduct more energy. Decay (γ=0.8) limits depth. Threshold (θ=0.3) creates sparsity.
              </p>
              <p>
                <strong className="text-white">4. Heat Diffusion:</strong> Recently accessed nodes have higher "heat", 
                biasing activation toward temporal relevance.
              </p>
              <p>
                <strong className="text-white">5. Information Gain Pruning:</strong> Uses MMR (Maximum Marginal Relevance) 
                to select non-redundant, high-value nodes for LLM context.
              </p>
              <p>
                <strong className="text-white">6. Weight Learning:</strong> Co-activated nodes strengthen their connections 
                (Hebbian learning), making the graph evolve based on usage. <strong className="text-green-400">NOW VISIBLE IN REAL-TIME!</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SCEDemo;
