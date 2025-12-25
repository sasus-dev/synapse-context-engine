# Custom Benchmark Template

The Synapse Context Engine (SCE) Evaluation Suite supports bulk JSON and CSV import.

## JSON Format (Recommended)

Create a `.json` file with a `queries` array.

```json
{
  "name": "My Custom Test Set",
  "queries": [
    "What is the capital of Finland?",
    "Explain quantum entanglement",
    "Who is Sasu?"
  ]
}
```

## CSV Format

Create a `.csv` file. The engine will look for a column named `query`, `input`, or `question`.

```csv
id,query,expected_answer
1,"What is the capital of Finland?",Helsinki
2,"Explain quantum entanglement",...
```

## Algorithmic Extraction

If "Algorithmic Extraction" is enabled, the engine will also report any entities (People, Locations, Concepts) found in the response using the active Regex rules.
