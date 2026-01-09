# Custom Properties Support

SkoHub Vocabs allows you to enrich your SKOS vocabularies with additional RDF properties that are not part of the standard SKOS specification. These properties can be configured to appear in the UI and are available in the machine-readable exports.

## Configuration

To enable custom properties, you need to update your `config.yaml` file with two new sections: `namespaces` and `custom_properties`.

### 1. Registering Namespaces

If your custom properties use specific RDF namespaces, you should register them. This allows you to use short IDs while ensuring the full URI is preserved in the JSON-LD output.

```yaml
namespaces:
  schema: "https://schema.org/"
  dct: "http://purl.org/dc/terms/"
  example: "http://example.org/ns#"
```

### 2. Defining Custom Properties

Each custom property is defined by an ID, a label, its RDF property URI, the classes it applies to, and its data type.

```yaml
custom_properties:
  - id: "contributor"
    label: "Contributor"◊
    property: "http://purl.org/dc/terms/contributor"
    classes: ["Concept", "ConceptScheme"]
    type: "languageMap"

  - id: "isBasedOn"
    label: "Based On"
    property: "schema:isBasedOn"
    classes: ["Concept"]
    type: "string"

  - id: "task"
    label: "Task"
    property: "example:task"
    classes: ["Concept"]
    type: "languageMapArray"
```

| Field | Description |
| :--- | :--- |
| `id` | A unique identifier used internally and in GraphQL. |
| `label` | The display name shown in the UI header. |
| `property` | The full RDF property URI (e.g., `http://purl.org/dc/terms/contributor`) OR a prefixed URI (e.g., `dct:contributor`) if the prefix is defined in the `namespaces` section. |
| `classes` | List of classes where this property should be extracted (`Concept`, `ConceptScheme`, `Collection`). |
| `type` | The data format: `string`, `languageMap`, or `languageMapArray`. |

## Data Types

The `type` field determines how SkoHub processes the data from the Turtle file and how it is rendered in the UI.

### `string`
Used for simple literals (e.g., dates, numbers) or URIs that don't vary by language.
*   **RDF**: `ex:concept schema:isBasedOn <http://other.org> .`
*   **GraphQL Type**: `String`
*   **UI**: Rendered as a simple string or link.

### `languageMap`
Used for properties that have a single value per language (like `skos:prefLabel`).
*   **RDF**: `ex:concept dct:contributor "John Doe"@en .`
*   **GraphQL Type**: `LanguageMap`
*   **UI**: The value matching the currently selected language is displayed.

### `languageMapArray`
Used for properties that can have multiple values per language (like `skos:altLabel`).
*   **RDF**: `ex:concept ex:task "Research"@en ; ex:task "Coding"@en .`
*   **GraphQL Type**: `LanguageMapArray`
*   **UI**: A list of values for the selected language is displayed.

## Implementation Details

### Data Layer
Custom properties are dynamically added to the Gatsby GraphQL schema during the `sourceNodes` phase. The parsing logic in `gatsby-node.js` extracts these properties from the JSON-LD compacted graph and attaches them to the respective nodes.

### UI Rendering

A generic `CustomProperties` component is responsible for iterating over the configured properties for a node and rendering them if data exists. It uses the `i18n` utility to ensure the correct language version is shown.

## Technical Details

### Automatic JSON-LD Context Management
SkoHub automatically generates the necessary JSON-LD context for your custom properties. For properties defined as `languageMap` or `languageMapArray`, it automatically adds `@container: @language` to the local context. This ensures that RDF literals with language tags are correctly compacted into the object structure (e.g., `{"en": "value"}`) that the UI components expect.

### Automatic GraphQL Query Generation
When you define a custom property as a `languageMap`, SkoHub's internal query generator automatically adds the required subfield selections for all active languages. You don't need to manually update GraphQL queries; the system ensures that complex types are fetched with their language subfields (e.g., `computationMethod { en de }`).

## Troubleshooting

### Error: Field "X" of type "LanguageMap" must have a selection of subfields
If you see this error, it usually means the custom property was recognized as a `LanguageMap` in the schema but was queried as a simple string. SkoHub Vocabs (on the `custom_properties` branch) fixes this by automatically generating these selections. Ensure you are using the latest version of `src/queries.js` and `gatsby-node.js`.

### Property is defined in config but not showing in UI
1. **Check Classes**: Ensure the `classes` array in `config.yaml` includes the type of the node you are viewing (e.g., `Concept`).
2. **Check RDF Type**: Ensure the property URI in your Turtle file exactly matches the `property` defined in the config (or matches via a defined prefix).
3. **Check Language Tags**: For `languageMap` types, ensure your RDF data has language tags (e.g., `"Value"@en`). If the data is a plain literal, it won't match the language map structure unless the context specifies it.
