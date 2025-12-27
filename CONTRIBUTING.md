# Contributing to Synapse Context Engine

Thank you for your interest in contributing to SCE! This project welcomes contributions from researchers, developers, and AI safety practitioners.

## 🎯 Ways to Contribute

### 🐛 Bug Reports
Found a bug? [Open an issue](https://github.com/sasus-dev/synapse-context-engine/issues/new?template=bug_report.md) with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Screenshots/logs if applicable

### 💡 Feature Requests
Have an idea? [Start a discussion](https://github.com/sasus-dev/synapse-context-engine/discussions/new?category=ideas) or [open a feature request](https://github.com/sasus-dev/synapse-context-engine/issues/new?template=feature_request.md).

### 📊 Research Contributions
- Benchmark results comparing SCE to RAG or other memory systems
- Parameter sensitivity analyses
- Scalability test results
- AI safety case studies
- Theoretical improvements

### 🔬 Code Contributions
- Performance optimizations
- New algorithms or pruning strategies
- UI/UX improvements
- Test coverage
- Documentation

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- For desktop builds: [Rust](https://rustup.rs) + platform dependencies
  - Windows: [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - macOS: Xcode Command Line Tools
  - Linux: `webkit2gtk` development packages

### Setup Development Environment

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/synapse-context-engine.git
cd synapse-context-engine

# 3. Install dependencies
npm install

# 4. Run web version
npm run dev

# 5. Run desktop version (requires Rust)
npm run tauri dev
```

---

## 📝 Development Workflow

### Branch Naming Convention
- `feature/` - New features (`feature/goal-directed-activation`)
- `fix/` - Bug fixes (`fix/traversal-depth-limit`)
- `docs/` - Documentation (`docs/update-architecture-guide`)
- `perf/` - Performance improvements (`perf/optimize-graph-traversal`)
- `test/` - Test additions (`test/hebbian-learning-suite`)

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add contradiction resolution UI
fix: prevent infinite loop in recursive traversal
docs: update spreading activation documentation
perf: optimize hyperedge lookups with indexing
test: add integration tests for MMR pruning
```

### Pull Request Process

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear, atomic commits

3. **Test thoroughly**
   ```bash
   npm test                    # Run test suite
   npm run lint                # Check code style
   npm run type-check          # TypeScript validation
   ```

4. **Update documentation** if needed
   - README.md for user-facing changes
   - Code comments for complex logic
   - docs/ for architectural changes

5. **Open a Pull Request** with:
   - Clear title describing the change
   - Detailed description of what and why
   - Screenshots/videos for UI changes
   - Reference related issues (`Fixes #123`)
   - Test results if applicable

6. **Respond to review feedback** promptly

---

## 🧪 Testing Guidelines

### Test Structure
```typescript
// tests/engine/spreading-activation.test.ts
describe('Spreading Activation', () => {
  it('should propagate energy with decay', () => {
    // Arrange
    const graph = createTestGraph();
    const seedNode = 'node-a';
    
    // Act
    const results = spreadActivation(graph, seedNode, { gamma: 0.8 });
    
    // Assert
    expect(results.get('node-b').energy).toBeLessThan(1.0);
  });
});
```

### Running Tests
```bash
npm test                    # All tests
npm test -- --watch         # Watch mode
npm test spreading          # Specific test file
npm run test:coverage       # Coverage report
```

---

## 🎨 Code Style

### TypeScript
- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use functional programming patterns where appropriate
- Keep functions small and focused

### React Components
```typescript
// ✅ Good
interface NodeProps {
  id: string;
  energy: number;
  onActivate: (id: string) => void;
}

export const Node: React.FC<NodeProps> = ({ id, energy, onActivate }) => {
  return (
    <div className="node" onClick={() => onActivate(id)}>
      <span>{id}</span>
      <span>{energy.toFixed(2)}</span>
    </div>
  );
};

// ❌ Avoid
export const Node = (props: any) => {
  // ...
};
```

### Naming Conventions
- **Components**: PascalCase (`NodeVisualizer`, `GraphExplorer`)
- **Functions**: camelCase (`spreadActivation`, `calculateMMR`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_DECAY`, `MAX_DEPTH`)
- **Types/Interfaces**: PascalCase (`HypergraphNode`, `ActivationResult`)

---

## 📊 Performance Guidelines

- Use `React.memo` for expensive components
- Debounce frequent user interactions
- Implement pagination for large node lists
- Profile before optimizing (use Chrome DevTools)
- Document performance-critical code sections

```typescript
// Example: Memoized graph calculation
const activatedNodes = useMemo(
  () => spreadActivation(graph, focusNode, config),
  [graph, focusNode, config]
);
```

---

## 🔬 Research Contributions

### Benchmark Submissions
Include:
- Methodology description
- Dataset characteristics
- Hardware specs
- Full result tables
- Statistical significance tests
- Comparison with baselines

### Theoretical Improvements
- Mathematical derivation
- Complexity analysis
- Connection to existing literature
- Implementation sketch

---

## 📚 Documentation

### Code Documentation
```typescript
/**
 * Propagates activation energy through the hypergraph using spreading activation.
 * 
 * @param graph - The hypergraph structure
 * @param seedNodes - Initial activation points
 * @param config - Activation parameters (decay, threshold, depth)
 * @returns Map of node IDs to activation energies
 * 
 * @example
 * ```typescript
 * const results = spreadActivation(graph, ['node-1'], {
 *   gamma: 0.85,
 *   theta: 0.3,
 *   maxDepth: 3
 * });
 * ```
 */
export function spreadActivation(
  graph: Hypergraph,
  seedNodes: string[],
  config: ActivationConfig
): Map<string, number> {
  // Implementation
}
```

### Architecture Decisions
Document significant architectural choices in `docs/architecture/decisions/`:
```markdown
# ADR 001: Use Hypergraphs Over Knowledge Graphs

## Context
Traditional knowledge graphs use binary relations...

## Decision
We will use directed hypergraphs to model memory...

## Consequences
- Preserves semantic atomicity
- Requires custom traversal algorithms
- Higher memory overhead
```

---

## 🤝 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers warmly
- Provide constructive feedback
- Focus on the problem, not the person
- Respect different viewpoints and experiences

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing others' private information
- Unethical or illegal activity

### Enforcement
Violations should be reported to the project maintainer. All complaints will be reviewed and investigated.

---

## 🎓 Learning Resources

New to the project? Start here:
1. [Architecture Paper](docs/blueprints/sce_initial_concept.pdf) - Theoretical foundation
2. [Open Questions](docs/notes/sasus_notes_01.md) - Research opportunities
3. [Latest Updates](docs/updates/) - Recent changes
4. [Code Structure](docs/architecture/code-structure.md) - Codebase overview

---

## 📞 Getting Help

- **Questions**: [GitHub Discussions](https://github.com/sasus-dev/synapse-context-engine/discussions)
- **Bugs**: [Issue Tracker](https://github.com/sasus-dev/synapse-context-engine/issues)
- **Security**: See [SECURITY.md](SECURITY.md)

---

## 🙏 Recognition

Contributors are recognized in:
- Repository README
- Release notes
- Academic publications (for significant research contributions)

---

Thank you for contributing to advancing transparent AI memory systems! 🧠✨