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
  const [prunedNodes, setPrunedNodes] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [graphStats, setGraphStats] = useState(null);
  const [newNodes, setNewNodes] = useState([]);
  const [extractionDebug, setExtractionDebug] = useState(null);

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
    calculateGraphStats(initialGraph);
  }, []);

  // Calculate graph statistics
  const calculateGraphStats = (g) => {
    if (!g) return;
    
    const nodeCount = Object.keys(g.nodes).length;
    const synapseCount = g.synapses.length;
    const avgWeight = g.synapses.reduce((sum, s) => sum + s.weight, 0) / synapseCount;
    
    // Find densest hub
    const connections = {};
    g.synapses.forEach(s => {
      connections[s.source] = (connections[s.source] || 0) + 1;
    });
    const densestHub = Object.entries(connections).sort((a, b) => b[1] - a[1])[0];
    
    // Count new synapses
    const newSynapses = g.synapses.filter(s => s.coActivations <= 1).length;
    
    setGraphStats({
      nodeCount,
      synapseCount,
      avgWeight,
      densestHub: densestHub ? { id: densestHub[0], count: densestHub[1] } : null,
      newSynapses
    });
  };

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

  // Information-theoretic pruning with MMR
  const pruneWithMMR = (activated, queryText, maxResults = 8) => {
    if (activated.length === 0) return [];
    
    const selected = [];
    const candidates = [...activated];
    const pruningLog = [];
    
    // Simple relevance scoring
    const relevance = (node) => {
      const label = graph.nodes[node]?.label?.toLowerCase() || '';
      const content = graph.nodes[node]?.content?.toLowerCase() || '';
      const queryLower = queryText.toLowerCase();
      const words = queryLower.split(' ');
      
      let score = 0;
      words.forEach(word => {
        if (label.includes(word)) score += 2;
        if (content.includes(word)) score += 1;
      });
      
      return score > 0 ? score / 10 : 0.1;
    };
    
    // Greedy MMR selection
    while (selected.length < maxResults && candidates.length > 0) {
      let bestIdx = 0;
      let bestGain = -Infinity;
      let bestMetrics = null;
      
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const rel = relevance(candidate.node);
        
        // Calculate redundancy
        let maxRedundancy = 0;
        selected.forEach(s => {
          const sameType = graph.nodes[s.node]?.type === graph.nodes[candidate.node]?.type;
          if (sameType) maxRedundancy = Math.max(maxRedundancy, 0.5);
        });
        
        const gain = (rel * candidate.biasedEnergy) / (1 + maxRedundancy);
        
        if (gain > bestGain) {
          bestGain = gain;
          bestIdx = i;
          bestMetrics = {
            node: candidate.node,
            relevance: rel,
            redundancy: maxRedundancy,
            energy: candidate.biasedEnergy,
            informationGain: gain,
            selected: true
          };
        }
      }
      
      pruningLog.push(bestMetrics);
      selected.push(candidates[bestIdx]);
      candidates.splice(bestIdx, 1);
    }
    
    // Log rejected nodes
    candidates.slice(0, 3).forEach(c => {
      const rel = relevance(c.node);
      let maxRedundancy = 0;
      selected.forEach(s => {
        const sameType = graph.nodes[s.node]?.type === graph.nodes[c.node]?.type;
        if (sameType) maxRedundancy = Math.max(maxRedundancy, 0.5);
      });
      
      pruningLog.push({
        node: c.node,
        relevance: rel,
        redundancy: maxRedundancy,
        energy: c.biasedEnergy,
        informationGain: (rel * c.biasedEnergy) / (1 + maxRedundancy),
        selected: false
      });
    });
    
    setPrunedNodes(pruningLog);
    return selected;
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

Extract which entity IDs are ACTUALLY relevant to this query.

IMPORTANT MATCHING RULES:
- Only match if the entity is CLEARLY mentioned or directly relevant
- "Sasu" should NOT match "Sarah" - they are different people
- "presentation" should match "Client Presentation" 
- Be precise, not fuzzy - close spelling doesn't mean same entity
- If you're unsure if something matches, DON'T include it

Return ONLY a JSON array of entity IDs that are DEFINITELY relevant.
Example: ["project_apollo", "contact_sarah"]

If NO entities match, return: []`
          }]
        })
      });

      const data = await response.json();
      const textContent = data.content?.find(c => c.type === 'text')?.text || '[]';
      const cleanText = textContent.replace(/```json\n?|\n?```/g, '').trim();
      const entities = JSON.parse(cleanText);
      return entities;
    } catch (err) {
      console.error('Entity extraction error:', err);
      // Fallback: only match exact word matches, case-insensitive
      const entities = [];
      const queryWords = queryText.toLowerCase().split(/\s+/);
      
      Object.entries(graph.nodes).forEach(([id, node]) => {
        const labelWords = node.label.toLowerCase().split(/\s+/);
        // Only match if there's at least one exact word match
        const hasExactMatch = labelWords.some(labelWord => 
          queryWords.some(queryWord => queryWord === labelWord && queryWord.length > 3)
        );
        if (hasExactMatch) {
          entities.push(id);
        }
      });
      
      return entities;
    }
  };

  // Query Claude with context
  const queryClaudeWithContext = async (query, contextNodes) => {
    let context = '';
    
    if (contextNodes.length > 0) {
      context = contextNodes
        .map(n => `[${graph.nodes[n.node]?.label}]\n${graph.nodes[n.node]?.content}`)
        .join('\n\n---\n\n');
    }

    try {
      const prompt = contextNodes.length > 0
        ? `You are an AI assistant with access to a knowledge graph memory system. Here is relevant context retrieved via spreading activation through the graph:

${context}

User Query: ${query}

Provide a helpful response using the context above. Be specific and reference the relevant information from the context.`
        : `You are an AI assistant. The user asked a question that didn't match any information in their knowledge graph.

User Query: ${query}

Provide a helpful response. Note that this query appears to be outside the scope of the available knowledge graph (which contains information about projects, documents, contacts, and preferences).`;

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
            content: prompt
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

  // Extract new information and create nodes
  const createNewNodesFromResponse = async (query, response, contextNodes) => {
    try {
      // Get existing node names for similarity checking
      const existingNames = Object.values(graph.nodes).map(n => n.label.toLowerCase());
      
      // Simpler, more direct prompt
      const extractionPrompt = `Look at this conversation and extract what NEW information should be saved to memory.

User said: "${query}"
Assistant said: "${response}"

CRITICAL RULES FOR EXTRACTION:
1. ONLY extract things that are BRAND NEW from the user's message
2. DO NOT extract things that were already in the provided context
3. If user says "meeting with X" or "X is the new Y" - that's NEW information
4. Be careful with names - "Sasu" and "Sarah" are DIFFERENT people
5. "Sisu" and "Sasu" are DIFFERENT people (don't assume typos)

Existing people/entities in the graph:
${Object.values(graph.nodes).map(n => n.label).join(', ')}

For each NEW entity:
- id: unique (e.g., "meeting_sasu_dec22", "contact_sisu")
- type: meeting, contact, document, fact, preference, tool, project, config
- label: exact name from conversation
- content: what was said about it
- connectTo: related entity IDs (can be empty [])

Return JSON:
{
  "newNodes": [
    {
      "id": "meeting_sasu_20241222",
      "type": "meeting",
      "label": "Meeting with Sasu",
      "content": "Meeting scheduled with Sasu",
      "connectTo": []
    }
  ]
}

If nothing new: {"newNodes": []}

Extract NEW information:`;

      console.log('=== STARTING NODE EXTRACTION ===');
      console.log('Query:', query);
      console.log('Response:', response);

      const extractResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: extractionPrompt
          }]
        })
      });

      if (!extractResponse.ok) {
        throw new Error(`API returned ${extractResponse.status}`);
      }

      const data = await extractResponse.json();
      const textContent = data.content?.find(c => c.type === 'text')?.text || '{"newNodes":[]}';
      
      console.log('=== RAW EXTRACTION RESPONSE ===');
      console.log(textContent);
      
      setExtractionDebug(textContent);
      
      // Parse JSON
      let cleanJson = textContent.trim();
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }
      
      console.log('=== CLEANED JSON ===');
      console.log(cleanJson);
      
      const extracted = JSON.parse(cleanJson);
      
      console.log('=== PARSED RESULT ===');
      console.log('newNodes array:', extracted.newNodes);
      console.log('Array length:', extracted.newNodes?.length || 0);

      if (!extracted.newNodes || extracted.newNodes.length === 0) {
        console.log('❌ NO NODES TO CREATE');
        setNewNodes([]);
        return 0;
      }

      console.log('✅ FOUND', extracted.newNodes.length, 'NODES TO CREATE');

      const updatedGraph = { ...graph };
      const addedNodes = [];

      extracted.newNodes.forEach((node, idx) => {
        console.log(`Processing node ${idx + 1}:`, node);
        
        // Check if node ID already exists
        if (updatedGraph.nodes[node.id]) {
          console.log('⚠️  Node ID already exists, skipping:', node.id);
          return;
        }

        // Check for similar names (fuzzy duplicate detection)
        const nodeLabelLower = node.label.toLowerCase();
        const similarExists = existingNames.some(existingName => {
          // Check if names are very similar (edit distance < 2 or contains)
          if (existingName === nodeLabelLower) return true;
          if (existingName.includes(nodeLabelLower) || nodeLabelLower.includes(existingName)) {
            // Only flag as duplicate if length difference is small
            return Math.abs(existingName.length - nodeLabelLower.length) < 3;
          }
          return false;
        });

        if (similarExists) {
          console.log('⚠️  Similar name already exists, skipping:', node.label);
          return;
        }

        // Add new node
        updatedGraph.nodes[node.id] = {
          type: node.type,
          label: node.label,
          content: node.content,
          heat: 0.9
        };

        addedNodes.push({
          id: node.id,
          label: node.label,
          type: node.type
        });

        console.log('✅ Created node:', node.id, '-', node.label);

        // Create connections
        const connectTo = node.connectTo || [];
        
        // Connect to Active Focus
        if (activeFocus && !connectTo.includes(activeFocus)) {
          connectTo.push(activeFocus);
        }

        // Add synapses
        connectTo.forEach(targetId => {
          if (updatedGraph.nodes[targetId]) {
            updatedGraph.synapses.push({
              source: node.id,
              target: targetId,
              weight: 0.5,
              coActivations: 1
            });
            console.log('✅ Created synapse:', node.id, '→', targetId);
          } else {
            console.log('⚠️  Target node not found:', targetId);
          }
        });
      });

      if (addedNodes.length > 0) {
        console.log('=== UPDATING GRAPH ===');
        console.log('Total nodes added:', addedNodes.length);
        console.log('New graph has', Object.keys(updatedGraph.nodes).length, 'nodes');
        
        setGraph(updatedGraph);
        setNewNodes(addedNodes);
        calculateGraphStats(updatedGraph);
        
        return addedNodes.length;
      } else {
        console.log('❌ NO NODES WERE ADDED (all filtered out)');
        setNewNodes([]);
        return 0;
      }

    } catch (err) {
      console.error('=== NODE CREATION ERROR ===');
      console.error(err);
      setError(`Failed to create new nodes: ${err.message}`);
      setNewNodes([]);
      return 0;
    }
  };
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
    calculateGraphStats(updatedGraph);
  };

  // Main query handler
  const handleQuery = async () => {
    if (!query.trim() || !graph) return;
    
    setStage('extracting');
    setError('');
    setExtractedEntities([]);
    setActivatedNodes([]);
    setClaudeResponse('');
    setNewNodes([]);

    try {
      // Step 1: Extract entities using Claude
      const entities = await extractEntitiesWithClaude(query);
      setExtractedEntities(entities);
      
      setStage('activating');
      await new Promise(r => setTimeout(r, 500));
      
      // Step 2: Spreading activation
      const seeds = [activeFocus, ...entities].filter((v, i, a) => a.indexOf(v) === i);
      const activated = spreadingActivation(seeds);
      setActivatedNodes(activated);
      
      // Check if we got any results
      if (activated.length === 0) {
        setStage('querying');
        // No context found - still ask Claude but without graph context
        const response = await queryClaudeWithContext(query, []);
        setClaudeResponse(response);
        setStage('complete');
        return;
      }
      
      // Step 2.5: MMR Pruning
      const topActivated = pruneWithMMR(activated, query, 8);
      
      setStage('querying');
      await new Promise(r => setTimeout(r, 500));
      
      // Step 3: Query Claude with context
      const response = await queryClaudeWithContext(query, topActivated.map(n => ({ node: n.node })));
      setClaudeResponse(response);
      
      // Step 4: Create new nodes from response
      const newNodeCount = await createNewNodesFromResponse(query, response, topActivated);
      
      // Step 5: Update weights
      updateWeights(topActivated.map(n => ({ node: n.node })));
      
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
            <button
              onClick={() => setShowStats(!showStats)}
              className="ml-auto bg-cyan-600/30 hover:bg-cyan-600/50 px-3 py-1 rounded border border-cyan-500 transition-colors text-xs"
            >
              {showStats ? '📊 Hide Stats' : '📊 Show Stats'}
            </button>
          </div>
        </div>

        {/* Graph Statistics Panel */}
        {showStats && graphStats && (
          <div className="bg-cyan-900/20 border-2 border-cyan-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-cyan-400">📊 Graph Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 p-4 rounded">
                <div className="text-sm text-gray-400">Total Nodes</div>
                <div className="text-2xl font-bold text-cyan-400">{graphStats.nodeCount}</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded">
                <div className="text-sm text-gray-400">Total Synapses</div>
                <div className="text-2xl font-bold text-purple-400">{graphStats.synapseCount}</div>
                {graphStats.newSynapses > 0 && (
                  <div className="text-xs text-green-400 mt-1">+{graphStats.newSynapses} new</div>
                )}
              </div>
              <div className="bg-slate-800/50 p-4 rounded">
                <div className="text-sm text-gray-400">Avg Weight</div>
                <div className="text-2xl font-bold text-yellow-400">{graphStats.avgWeight.toFixed(3)}</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded">
                <div className="text-sm text-gray-400">Densest Hub</div>
                <div className="text-sm font-bold text-orange-400">
                  {graph?.nodes[graphStats.densestHub?.id]?.label || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">{graphStats.densestHub?.count} connections</div>
              </div>
            </div>
            
            {/* Activation Heatmap */}
            {activatedNodes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 text-cyan-300">Activation Heatmap</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(graph.nodes).map(([id, node]) => {
                    const activated = activatedNodes.find(a => a.node === id);
                    const energy = activated?.biasedEnergy || 0;
                    
                    let colorClass = 'bg-slate-700 text-gray-400';
                    if (energy > 0.7) colorClass = 'bg-red-600 text-white';
                    else if (energy > 0.3) colorClass = 'bg-yellow-600 text-white';
                    else if (energy > 0) colorClass = 'bg-blue-600 text-white';
                    
                    return (
                      <div key={id} className={`${colorClass} px-2 py-1 rounded text-xs`}>
                        {node.label.split(' ')[0]}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-600 rounded"></div> Strong (&gt;0.7)
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-600 rounded"></div> Medium (0.3-0.7)
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div> Weak (&lt;0.3)
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-slate-700 rounded"></div> Inactive
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Focus */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold">Active Focus (Persistent Context)</h2>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            Automatically syncs with your current workspace - like which project page you're viewing or what task you're working on. 
            In a production Digital Twin system, this would update when you navigate between projects, switch contexts, or open different views. 
            It anchors all queries to the right data without you having to specify "I'm in Project Apollo" every time. 
            Think of it as the system knowing WHERE you are and WHAT you're focused on.
          </p>
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
          <p className="text-xs text-gray-400 mt-2">
            💡 In production: This would auto-update based on UI navigation (project pages, task views, etc.)
          </p>
        </div>

        {/* Query Interface */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Ask Claude (with SCE Memory)</h2>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            Ask anything! Claude will use spreading activation to find relevant information from the knowledge graph, 
            then respond with context-aware answers. The graph learns from each interaction, getting smarter over time. 
            Try asking the same question twice to see the memory improvement!
          </p>
          
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
                ) : activatedNodes.length === 0 ? (
                  <div className="bg-orange-900/30 border border-orange-500 rounded p-4">
                    <p className="text-orange-300">
                      ⚠️ No nodes activated - query appears to be outside the knowledge graph scope. 
                      Claude will respond without graph context.
                    </p>
                  </div>
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

            {/* Step 2.5: Information-Theoretic Pruning */}
            {prunedNodes.length > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3 text-orange-400">
                  Step 2.5: Information-Theoretic Pruning (MMR)
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Maximum Marginal Relevance selects nodes with high information gain: 
                  <code className="bg-slate-800 px-2 py-1 rounded text-xs ml-2">
                    Gain = (Relevance × Energy) / (1 + Redundancy)
                  </code>
                </p>
                <div className="space-y-2">
                  {prunedNodes.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded border ${
                        item.selected 
                          ? 'bg-green-900/30 border-green-600' 
                          : 'bg-red-900/20 border-red-600/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.selected ? (
                              <span className="text-green-400 font-bold">✓</span>
                            ) : (
                              <span className="text-red-400 font-bold">✗</span>
                            )}
                            <span className={`font-semibold ${item.selected ? 'text-green-300' : 'text-red-300'}`}>
                              {graph?.nodes[item.node]?.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-2 grid grid-cols-4 gap-2">
                            <div>
                              <span className="text-gray-500">Rel:</span> {item.relevance.toFixed(2)}
                            </div>
                            <div>
                              <span className="text-gray-500">Red:</span> {item.redundancy.toFixed(2)}
                            </div>
                            <div>
                              <span className="text-gray-500">Energy:</span> {item.energy.toFixed(3)}
                            </div>
                            <div className="font-semibold">
                              <span className="text-gray-500">Gain:</span> {item.informationGain.toFixed(3)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-400 bg-slate-800/30 p-2 rounded">
                  ✅ <strong>{prunedNodes.filter(n => n.selected).length} nodes selected</strong> for maximum information density | 
                  ❌ <strong className="ml-2">{prunedNodes.filter(n => !n.selected).length} rejected</strong> as redundant
                </div>
              </div>
            )}

            {/* Step 3: Claude Response */}
            {(stage === 'querying' || claudeResponse) && (
              <div className={`bg-white/10 backdrop-blur rounded-lg p-6 ${stage === 'querying' ? 'animate-pulse' : ''}`}>
                <h3 className="text-lg font-semibold mb-3 text-yellow-400">
                  Step 3: Claude Responds (Context-Aware)
                </h3>
                {stage === 'querying' ? (
                  <p className="text-gray-400">Claude processing with selected context...</p>
                ) : (
                  <div className="bg-slate-800/50 p-4 rounded border border-yellow-600">
                    <p className="text-gray-200 whitespace-pre-wrap">{claudeResponse}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: New Node Creation */}
            {stage === 'complete' && (
              <div className={`border-2 rounded-lg p-6 mb-6 ${
                newNodes.length > 0 
                  ? 'bg-blue-900/20 border-blue-500' 
                  : 'bg-gray-900/20 border-gray-600'
              }`}>
                <div className="flex items-center gap-2 text-blue-400 mb-4">
                  <Brain className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">
                    Step 4: Memory Expansion {newNodes.length > 0 ? '(New Nodes Created!)' : '(No New Nodes)'}
                  </h3>
                </div>
                {newNodes.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-300 mb-3">
                      The system learned new information from this conversation and added it to the graph!
                    </p>
                    <div className="space-y-2">
                      {newNodes.map((node, idx) => (
                        <div key={idx} className="bg-blue-900/50 p-3 rounded border border-blue-400">
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-blue-600 text-xs px-2 py-1 rounded">NEW</span>
                            <span className="text-blue-200 font-semibold">{node.label}</span>
                            <span className="text-xs text-gray-400">({node.type})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-300 bg-slate-800/50 p-2 rounded">
                      🌱 <strong>Graph expanded!</strong> {newNodes.length} new node(s) added and connected to existing knowledge.
                      The memory is growing organically from conversations!
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400">
                    <p className="mb-2">
                      No new information detected to add to the graph.
                    </p>
                    {extractionDebug && (
                      <details className="mt-3 bg-slate-800 p-3 rounded text-xs">
                        <summary className="cursor-pointer text-yellow-400 mb-2">🔍 Show Extraction Debug</summary>
                        <pre className="whitespace-pre-wrap text-gray-300 overflow-auto max-h-48">
                          {extractionDebug}
                        </pre>
                      </details>
                    )}
                    <p className="mt-2 text-xs text-yellow-400">
                      💡 Try: "Add meeting with [name] tomorrow" or "Jack is the new CTO"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Weight Updates */}
            {stage === 'complete' && weightChanges.length > 0 && (
              <div className="bg-green-900/20 border-2 border-green-600 rounded-lg p-6 animate-pulse">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <Activity className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">Step {newNodes.length > 0 ? '5' : '4'}: Memory Learning (Hebbian Updates)</h3>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
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
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">🚀 How To Use This Demo</h3>
            <div className="space-y-4 text-gray-300">
              <div className="bg-blue-900/20 border border-blue-500 rounded p-4">
                <p className="font-semibold text-blue-300 mb-2">📋 Quick Start (Copy & Paste):</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to <a href="https://github.com/sasus-dev/synapse-context-engine" target="_blank" className="text-blue-400 underline">GitHub repo</a> and copy this artifact code</li>
                  <li>Open a new Claude chat</li>
                  <li>Paste the code and say "create an artifact from this"</li>
                  <li><strong className="text-yellow-400">Optional but recommended:</strong> Paste the SCE paper/blueprint into the chat so Claude understands the theory</li>
                  <li>Start asking questions and watch the magic happen! 🎩✨</li>
                </ol>
              </div>
              <p>
                <strong className="text-white">What's Happening Behind The Scenes:</strong>
              </p>
              <p>
                <strong className="text-white">Step 1 - Entity Extraction:</strong> Claude identifies which concepts in the knowledge graph relate to your query
              </p>
              <p>
                <strong className="text-white">Step 2 - Spreading Activation:</strong> Energy propagates through connections, finding related concepts (even ones not mentioned!)
              </p>
              <p>
                <strong className="text-white">Step 2.5 - Smart Pruning (MMR):</strong> Selects the most informative nodes while avoiding redundancy. 
                Picks nodes with high <code className="bg-slate-800 px-1 rounded text-xs">Information Gain = (Relevance × Energy) / (1 + Redundancy)</code>
              </p>
              <p>
                <strong className="text-white">Step 3 - Context Injection:</strong> Selected nodes are sent to Claude as context for a smarter answer
              </p>
              <p>
                <strong className="text-white">Step 4 - Memory Expansion:</strong> New information from Claude's response is extracted and added as new nodes in the graph
              </p>
              <p>
                <strong className="text-white">Step 5 - Hebbian Learning:</strong> Connections strengthen when concepts are used together (the graph learns!)
              </p>
              <p className="text-yellow-400 font-semibold">
                ✨ Try asking the same question twice! The second answer will be better because the memory improved.
              </p>
              <div className="bg-purple-900/20 border border-purple-500 rounded p-3 mt-4">
                <p className="text-sm">
                  <strong>💡 Pro Tip:</strong> Use the "📊 Show Stats" button to see graph analytics, activation heatmaps, 
                  and watch exactly which nodes get selected/rejected during pruning!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SCEClaudeDemo;
