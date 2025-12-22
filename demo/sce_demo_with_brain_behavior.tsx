import React, { useState, useEffect } from 'react';
import { Brain, Zap, MessageSquare, Activity, TrendingUp, Github } from 'lucide-react';

const SCEClaudeDemo = () => {
  const [query, setQuery] = useState('');
  const [activeFocus, setActiveFocus] = useState('project_apollo');
  const [stage, setStage] = useState('idle');
  const [extractedEntities, setExtractedEntities] = useState([]);
  const [activatedNodes, setActivatedNodes] = useState([]);
  const [claudeResponse, setClaudeResponse] = useState('');
  const [graph, setGraph] = useState(null);
  const [iteration, setIteration] = useState(0);
  const [error, setError] = useState('');
  const [weightChanges, setWeightChanges] = useState([]);

  // Enhanced graph with actual content
  const initialGraph = {
    nodes: {
      project_apollo: { 
        type: 'project', 
        label: 'Apollo Redesign',
        content: 'Major UI/UX redesign project for our flagship product. Client: TechCorp. Timeline: Q4 2024. Budget: $150K. Focus on mobile-first design and accessibility.',
        heat: 0.9 
      },
      project_zeus: { 
        type: 'project', 
        label: 'Zeus Analytics',
        content: 'Internal analytics dashboard for tracking company metrics. Still in planning phase.',
        heat: 0.3 
      },
      doc_presentation: { 
        type: 'document', 
        label: 'Client Presentation',
        content: 'Q3 progress presentation for TechCorp. Includes mockups, user testing results, and timeline updates. Client feedback: very positive, requested more visual examples.',
        heat: 0.7 
      },
      doc_dashboard: { 
        type: 'document', 
        label: 'Performance Dashboard',
        content: 'Real-time metrics showing user engagement, load times, and conversion rates. Updated weekly. Last update showed 15% improvement in mobile performance.',
        heat: 0.8 
      },
      doc_guidelines: { 
        type: 'document', 
        label: 'Brand Guidelines',
        content: 'TechCorp brand standards: primary color #2563eb, secondary #7c3aed. Typography: Inter for headings, system fonts for body. Maintain 4.5:1 contrast ratio.',
        heat: 0.4 
      },
      contact_sarah: { 
        type: 'contact', 
        label: 'Sarah Chen (Design Lead)',
        content: 'Lead designer on Apollo project. Expert in Figma and design systems. Prefers async communication. Available Mon-Fri 9am-5pm PST.',
        heat: 0.6 
      },
      contact_john: { 
        type: 'contact', 
        label: 'John Smith (Client)',
        content: 'TechCorp product manager. Very detail-oriented. Prefers visual presentations over text. Usually responds within 24 hours. Interested in quarterly metrics comparisons.',
        heat: 0.5 
      },
      pref_visual: { 
        type: 'preference', 
        label: 'Client Prefers Visual',
        content: 'John Smith consistently gives positive feedback on visual mockups and diagrams, less engagement with text-heavy reports.',
        heat: 0.5 
      },
      pref_minimal: { 
        type: 'preference', 
        label: 'Minimal Text Style',
        content: 'Client preference for concise, bullet-point style communication. Avoid lengthy paragraphs.',
        heat: 0.5 
      },
      behavior_quarterly: { 
        type: 'behavior', 
        label: 'Quarterly Comparison Pattern',
        content: 'Client consistently asks for quarter-over-quarter comparisons in meetings. Prepare comparative data in advance.',
        heat: 0.3 
      },
      tool_figma: { 
        type: 'tool', 
        label: 'Figma Design',
        content: 'Primary design tool. Shared workspace at figma.com/apollo-redesign. Sarah has admin access.',
        heat: 0.4 
      },
      config_template: { 
        type: 'config', 
        label: 'Presentation Template',
        content: 'Standard presentation template with TechCorp branding. Includes sections: Overview, Progress, Metrics, Next Steps, Q&A.',
        heat: 0.6 
      },
    },
    synapses: [
      { source: 'project_apollo', target: 'doc_presentation', weight: 0.9, coActivations: 0 },
      { source: 'project_apollo', target: 'doc_dashboard', weight: 0.85, coActivations: 0 },
      { source: 'project_apollo', target: 'contact_sarah', weight: 0.8, coActivations: 0 },
      { source: 'project_apollo', target: 'contact_john', weight: 0.75, coActivations: 0 },
      { source: 'project_apollo', target: 'config_template', weight: 0.7, coActivations: 0 },
      { source: 'doc_presentation', target: 'config_template', weight: 0.9, coActivations: 0 },
      { source: 'doc_presentation', target: 'pref_visual', weight: 0.8, coActivations: 0 },
      { source: 'doc_presentation', target: 'tool_figma', weight: 0.7, coActivations: 0 },
      { source: 'doc_presentation', target: 'behavior_quarterly', weight: 0.6, coActivations: 0 },
      { source: 'doc_dashboard', target: 'contact_sarah', weight: 0.7, coActivations: 0 },
      { source: 'doc_dashboard', target: 'doc_presentation', weight: 0.65, coActivations: 0 },
      { source: 'doc_dashboard', target: 'behavior_quarterly', weight: 0.8, coActivations: 0 },
      { source: 'contact_john', target: 'pref_visual', weight: 0.85, coActivations: 0 },
      { source: 'contact_john', target: 'pref_minimal', weight: 0.8, coActivations: 0 },
      { source: 'contact_sarah', target: 'tool_figma', weight: 0.9, coActivations: 0 },
      { source: 'contact_sarah', target: 'config_template', weight: 0.75, coActivations: 0 },
      { source: 'contact_sarah', target: 'doc_guidelines', weight: 0.7, coActivations: 0 },
    ]
  };

  useEffect(() => {
    setGraph(initialGraph);
  }, []);

  // Spreading activation
  const spreadingActivation = (seeds, maxDepth = 3, gamma = 0.8, theta = 0.3) => {
    if (!graph) return [];
    
    const activation = {};
    const visited = new Set();
    const paths = {};
    
    seeds.forEach(seed => {
      activation[seed] = 1.0;
      paths[seed] = { depth: 0, path: [seed], energy: 1.0 };
    });
    
    const adjacency = {};
    graph.synapses.forEach(syn => {
      if (!adjacency[syn.source]) adjacency[syn.source] = [];
      adjacency[syn.source].push({ target: syn.target, weight: syn.weight });
    });
    
    const queue = seeds.map(s => ({ node: s, depth: 0, energy: 1.0, path: [s] }));
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      if (current.depth >= maxDepth) continue;
      if (visited.has(current.node + '_' + current.depth)) continue;
      visited.add(current.node + '_' + current.depth);
      
      const neighbors = adjacency[current.node] || [];
      
      neighbors.forEach(({ target, weight }) => {
        if (current.path.includes(target)) return;
        
        const newEnergy = current.energy * weight * gamma;
        let activatedEnergy = 0;
        if (newEnergy >= theta) {
          activatedEnergy = (newEnergy - theta) / (1 + (newEnergy - theta));
        }
        
        if (activatedEnergy > 0) {
          if (!activation[target] || activation[target] < activatedEnergy) {
            activation[target] = activatedEnergy;
            paths[target] = {
              depth: current.depth + 1,
              path: [...current.path, target],
              energy: activatedEnergy
            };
          }
          
          queue.push({
            node: target,
            depth: current.depth + 1,
            energy: activatedEnergy,
            path: [...current.path, target]
          });
        }
      });
    }
    
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

  // Entity extraction using Claude
  const extractEntitiesWithClaude = async (queryText) => {
    const entityList = Object.entries(graph.nodes)
      .map(([id, node]) => `${id}: ${node.label}`)
      .join('\n');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Given this user query: "${queryText}"

And these available entities in the knowledge graph:
${entityList}

Extract which entity IDs are relevant to this query. Consider:
- Direct mentions (if query mentions "Sarah", return contact_sarah)
- Semantic relevance (if query about "design", consider tool_figma, contact_sarah, doc_guidelines)
- Context (if about presentations, include related docs and preferences)

Return ONLY a JSON array of entity IDs, nothing else. Example: ["project_apollo", "contact_sarah"]`
          }]
        })
      });

      const data = await response.json();
      const textContent = data.content?.find(c => c.type === 'text')?.text || '[]';
      const entities = JSON.parse(textContent.replace(/```json\n?|\n?```/g, '').trim());
      return entities;
    } catch (err) {
      console.error('Entity extraction error:', err);
      // Fallback to keyword matching
      const entities = [];
      const lower = queryText.toLowerCase();
      Object.entries(graph.nodes).forEach(([id, node]) => {
        const label = node.label.toLowerCase();
        if (label.split(' ').some(word => lower.includes(word))) {
          entities.push(id);
        }
      });
      return entities;
    }
  };

  // Query Claude with context
  const queryClaudeWithContext = async (query, contextNodes) => {
    const context = contextNodes
      .map(n => `[${graph.nodes[n.node]?.label}]\n${graph.nodes[n.node]?.content}`)
      .join('\n\n---\n\n');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `You are an AI assistant with access to a knowledge graph memory system. Here is relevant context retrieved via spreading activation through the graph:

${context}

User Query: ${query}

Provide a helpful response using the context above. Be specific and reference the relevant information from the context.`
          }]
        })
      });

      const data = await response.json();
      return data.content?.find(c => c.type === 'text')?.text || 'No response generated';
    } catch (err) {
      console.error('Claude query error:', err);
      throw new Error(`Failed to query Claude: ${err.message}`);
    }
  };

  // Update weights (Hebbian learning)
  const updateWeights = (activatedNodes) => {
    const eta = 0.1;
    const updatedGraph = { ...graph };
    const changes = [];
    
    for (let i = 0; i < activatedNodes.length; i++) {
      for (let j = i + 1; j < activatedNodes.length; j++) {
        const node1 = activatedNodes[i].node;
        const node2 = activatedNodes[j].node;
        
        let synapseFound = false;
        updatedGraph.synapses = updatedGraph.synapses.map(syn => {
          if ((syn.source === node1 && syn.target === node2) ||
              (syn.source === node2 && syn.target === node1)) {
            synapseFound = true;
            const oldWeight = syn.weight;
            const newWeight = Math.min(syn.weight + eta * (1 - syn.weight), 1.0);
            const delta = newWeight - oldWeight;
            
            if (delta > 0.001) {
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
        
        if (!synapseFound) {
          const newWeight = 0.5 * eta;
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

  // Main query handler
  const handleQuery = async () => {
    if (!query.trim() || !graph) return;
    
    setStage('extracting');
    setError('');
    setExtractedEntities([]);
    setActivatedNodes([]);
    setClaudeResponse('');

    try {
      // Step 1: Extract entities using Claude
      const entities = await extractEntitiesWithClaude(query);
      setExtractedEntities(entities);
      
      setStage('activating');
      await new Promise(r => setTimeout(r, 500));
      
      // Step 2: Spreading activation
      const seeds = [activeFocus, ...entities].filter((v, i, a) => a.indexOf(v) === i);
      const activated = spreadingActivation(seeds);
      const topActivated = activated.slice(0, 8);
      setActivatedNodes(topActivated);
      
      setStage('querying');
      await new Promise(r => setTimeout(r, 500));
      
      // Step 3: Query Claude with context
      const response = await queryClaudeWithContext(query, topActivated);
      setClaudeResponse(response);
      
      // Step 4: Update weights
      updateWeights(topActivated);
      
      setStage('complete');
    } catch (err) {
      setError(err.message);
      setStage('idle');
    }
  };

  const presetQueries = [
    "What should I include in the next client presentation?",
    "Who can help me with the design updates?",
    "What are the client's preferences for presentations?",
    "Show me the quarterly performance metrics"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Brain className="w-10 h-10 text-purple-400" />
              <div>
                <h1 className="text-4xl font-bold">SCE + Claude Integration</h1>
                <p className="text-sm text-gray-400 mt-1">Synapse Context Engine with built-in Claude AI</p>
              </div>
            </div>
            <a 
              href="https://github.com/sasus-dev/synapse-context-engine" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
          </div>
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-200">
              <strong>✨ No API keys needed!</strong> This demo uses Claude directly. Copy code from GitHub → Paste in Claude chat → Start using!
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-purple-300">
              Iteration: <strong className="text-xl text-purple-400">{iteration}</strong>
            </span>
            <span className="text-yellow-300">
              Active Focus: <strong>{graph?.nodes[activeFocus]?.label}</strong>
            </span>
            <span className="text-green-300">
              Memory Updates: <strong>{weightChanges.length}</strong>
            </span>
          </div>
        </div>

        {/* Active Focus */}
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
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Ask Claude (with SCE Memory)</h2>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="Ask something about your context..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white"
              disabled={stage !== 'idle' && stage !== 'complete'}
            />
            <button
              onClick={handleQuery}
              disabled={stage !== 'idle' && stage !== 'complete'}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-2 rounded transition-colors"
            >
              {stage === 'idle' || stage === 'complete' ? 'Ask' : 'Processing...'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {presetQueries.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(pq)}
                disabled={stage !== 'idle' && stage !== 'complete'}
                className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 px-3 py-1 rounded text-sm transition-colors"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Visualization */}
        {stage !== 'idle' && (
          <div className="space-y-6">
            {/* Step 1: Entity Extraction */}
            {(stage === 'extracting' || extractedEntities.length > 0) && (
              <div className={`bg-white/10 backdrop-blur rounded-lg p-6 ${stage === 'extracting' ? 'animate-pulse' : ''}`}>
                <h3 className="text-lg font-semibold mb-3 text-green-400">
                  Step 1: Claude Extracts Relevant Entities
                </h3>
                {stage === 'extracting' ? (
                  <p className="text-gray-400">Asking Claude which entities are relevant...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {extractedEntities.map(id => (
                      <div key={id} className="bg-green-900/50 px-3 py-1 rounded border border-green-500">
                        {graph?.nodes[id]?.label || id}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Spreading Activation */}
            {(stage === 'activating' || activatedNodes.length > 0) && (
              <div className={`bg-white/10 backdrop-blur rounded-lg p-6 ${stage === 'activating' ? 'animate-pulse' : ''}`}>
                <h3 className="text-lg font-semibold mb-3 text-blue-400">
                  Step 2: SCE Spreading Activation (Associative Memory)
                </h3>
                {stage === 'activating' ? (
                  <p className="text-gray-400">Energy propagating through knowledge graph...</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-300 mb-4">
                      Starting from <strong className="text-green-400">{extractedEntities.length} seed nodes</strong>, 
                      energy spreads through synaptic connections. Nodes activate based on connection strength (weights) 
                      and recency (heat). This finds related concepts even if not directly mentioned!
                    </p>
                    <div className="space-y-2">
                      {activatedNodes.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-3 rounded border border-slate-600">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-blue-300 mb-1">
                                {graph?.nodes[item.node]?.label}
                              </div>
                              <div className="text-xs text-gray-400">
                                Path: {item.path.map(n => graph?.nodes[n]?.label).join(' → ')}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm text-purple-400 font-mono">
                                {item.biasedEnergy.toFixed(3)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Depth: {item.depth}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 bg-slate-700 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(item.biasedEnergy * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-400 bg-slate-800/30 p-2 rounded">
                      💡 <strong>Total activated:</strong> {activatedNodes.length} nodes | 
                      <strong className="ml-2">Algorithm:</strong> BFS with energy decay (γ=0.8) and threshold (θ=0.3)
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Claude Response */}
            {(stage === 'querying' || claudeResponse) && (
              <div className={`bg-white/10 backdrop-blur rounded-lg p-6 ${stage === 'querying' ? 'animate-pulse' : ''}`}>
                <h3 className="text-lg font-semibold mb-3 text-yellow-400">
                  Step 3: Claude Responds (Using Retrieved Context)
                </h3>
                {stage === 'querying' ? (
                  <p className="text-gray-400">Claude processing with graph context...</p>
                ) : (
                  <div className="bg-slate-800/50 p-4 rounded border border-yellow-600">
                    <p className="text-gray-200 whitespace-pre-wrap">{claudeResponse}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Weight Updates */}
            {stage === 'complete' && weightChanges.length > 0 && (
              <div className="bg-green-900/20 border-2 border-green-600 rounded-lg p-6 animate-pulse">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <Activity className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">Step 4: Memory Learning (Hebbian Updates)</h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
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
                            Δ +{change.delta}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-300 bg-slate-800/50 p-3 rounded">
                  <strong>🧠 The graph is learning!</strong> {weightChanges.length} connections strengthened.
                  Ask the same question again to see improved results!
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border-2 border-red-600 rounded-lg p-6 mt-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Explanation */}
        {stage === 'idle' && (
          <div className="bg-white/5 backdrop-blur rounded-lg p-8 border border-purple-500/30 mt-6">
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">🚀 How To Use</h3>
            <div className="space-y-4 text-gray-300">
              <div className="bg-blue-900/20 border border-blue-500 rounded p-4">
                <p className="font-semibold text-blue-300 mb-2">📋 Copy & Paste Demo:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Copy this artifact code from GitHub</li>
                  <li>Paste into a Claude chat</li>
                  <li>Say "create an artifact from this"</li>
                  <li>Start asking questions!</li>
                </ol>
              </div>
              <p>
                <strong className="text-white">How It Works:</strong>
              </p>
              <p>
                <strong className="text-white">1. Entity Extraction:</strong> Claude identifies relevant concepts from your query
              </p>
              <p>
                <strong className="text-white">2. Spreading Activation:</strong> Energy propagates through the knowledge graph finding related information
              </p>
              <p>
                <strong className="text-white">3. Context Retrieval:</strong> Retrieved nodes are sent to Claude as context
              </p>
              <p>
                <strong className="text-white">4. Hebbian Learning:</strong> Connections strengthen based on co-activation
              </p>
              <p className="text-yellow-400 font-semibold">
                ✨ The memory gets smarter with each query! Try asking the same question twice to see the difference.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SCEClaudeDemo;
