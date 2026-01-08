# SkoHub Vocabs Overview

SkoHub Vocabs is a static site generator for SKOS vocabularies. It transforms Turtle-based RDF data into a navigable, searchable web interface and provides the data in machine-readable formats (JSON, JSON-LD).

## Architecture and Key Technologies

The project is built as a static site generator using **Gatsby**, ensuring high performance and SEO friendliness.

- **Core Framework**: [Gatsby](https://www.gatsbyjs.com/) (v5)
- **UI Library**: [React](https://reactjs.org/)
- **Data Layer**: Gatsby's GraphQL data layer, populated by parsing RDF data at build time.
- **RDF Processing**: 
    - [N3.js](https://github.com/rdfjs/n3.js/) and [jsonld.js](https://github.com/digitalbazaar/jsonld.js) for parsing and compacting RDF data.
    - [SHACL](https://www.w3.org/TR/shacl/) for data validation via `rdf-validate-shacl`.
- **Search**: [Flexsearch](https://github.com/nextapps-de/flexsearch) for fast, client-side full-text search.
- **Styling**: [Emotion](https://emotion.sh/) for CSS-in-JS.
- **Validation**: Ensures that the input vocabularies follow the [SkoHub SHACL shapes](https://github.com/skohub-io/skohub-shacl).

## Source Code Structure

- `/src`: The main source code directory.
    - `components/`: Reusable React components (e.g., `Concept.jsx`, `ConceptScheme.jsx`, `Header.jsx`).
    - `templates/`: Main App shell and layout templates.
    - `types.js`: Defines the GraphQL schema for the Gatsby data layer.
    - `queries.js`: Contains GraphQL queries used by components to fetch data.
    - `common.js`: Utility functions (i18n, URI handling, path generation).
    - `validate.js`: SHACL validation logic.
- `/data`: **Input directory.** Place your `.ttl` (Turtle) files here.
- `/shapes`: Contains `skohub.shacl.ttl`, used for validating the input data.
- `gatsby-node.js`: The core build-time logic. It parses RDF files, creates Gatsby nodes, and generates pages.
- `gatsby-config.js`: Gatsby configuration (plugins, site metadata).
- `Dockerfile`: Production build configuration for creating a Docker image.

## Customizing the UI for Additional RDF Classes and Properties

To support additional RDF properties or custom classes (e.g., adding a `schema:contributor` property to a Concept), follow these steps:

### 1. Data Extraction
In `gatsby-node.js`, modify the `onPreBootstrap` function. This function iterates over the compacted JSON-LD graph. You need to pull your new property out of the graph and add it to the `node` object.

```javascript
// Example: Extracting a 'contributor' property
const { contributor, ...properties } = graph
const node = {
  ...properties,
  contributor: contributor || null,
  // ... rest of the node
}
```

### 2. GraphQL Schema Update
Update `src/types.js` to include the new property in the relevant type definition (e.g., `type Concept`).

```javascript
type Concept implements Node {
  # ... existing fields
  contributor: [String]
}
```

### 3. Query Update
Update `src/queries.js` to fetch the new property in the `allConcept` query.

```javascript
module.exports.allConcept = (inScheme, languages) => `
  {
    allConcept(...) {
      edges {
        node {
          # ... existing fields
          contributor
        }
      }
    }
  }
`
```

### 4. Component Update
Update the relevant React component (e.g., `src/components/Concept.jsx`) to render the new data.

```jsx
{concept.contributor && (
  <div>
    <h3>Contributors</h3>
    <ul>
      {concept.contributor.map(c => <li key={c}>{c}</li>)}
    </ul>
  </div>
)}
```

## Deploying to Docker Hub as a Custom Image

You can package SkoHub Vocabs along with your vocabulary data into a custom Docker image.

### Building the Image
1. Ensure your vocabulary files are in the `data/` directory.
2. Build the Docker image:
   ```bash
   docker build -t your-dockerhub-username/my-vocab-site:latest .
   ```

### Pushing to Docker Hub
1. Log in to Docker Hub:
   ```bash
   docker login
   ```
2. Push your image:
   ```bash
   docker push your-dockerhub-username/my-vocab-site:latest
   ```

### Automating Deployment with GitHub Actions

The project includes a GitHub Action workflow in `.github/workflows/main.yml` that can automatically build and push your Docker image. To use it for your own fork:

1.  **Configure GitHub Secrets**: In your GitHub repository, go to `Settings > Secrets and variables > Actions` and add:
    *   `DOCKERHUB_USERNAME`: Your Docker Hub username.
    *   `DOCKERHUB_TOKEN`: A Personal Access Token from Docker Hub.
2.  **Adjust the Image Name**:
    Modify the `docker` job in `.github/workflows/main.yml`. Change the `images` value under the `meta` step to your target repository:
    ```yaml
    - name: Docker meta
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: your-dockerhub-username/your-repo-name # Change this
    ```
3.  **Branch Configuration**:
    By default, the workflow pushes to Docker Hub on every push to `main` or `dev`. You can adjust this in the `if` condition of the `docker` job:
    ```yaml
    if: ${{ github.ref == 'refs/heads/main' || github.ref == 'refs/heads/your-custom-branch' }}
    ```

### Docker Container Structure and Persistence

When running SkoHub Vocabs in a container, it's important to understand where data lives and how to persist your own vocabularies.

#### Directory Structure (Inside Container)
*   `/app`: The application root directory (where `package.json` and `gatsby-config.js` reside).
*   `/app/data`: The input directory for Turtle (`.ttl`) files.
*   `/app/public`: The directory where the static site is generated.
*   `/app/config.yaml`: The optional configuration file.
*   `/app/.env`: Environment variables.

#### Volumes and Mounts
If you are using the pre-built image or your own custom image, you can mount your local data at runtime:

*   **Mounting Data**: To build the site using your local vocabularies without rebuilding the image:
    ```bash
    docker run -v $(pwd)/my-data:/app/data your-image-name
    ```
*   **Persistent Config**: To provide a custom configuration:
    ```bash
    docker run -v $(pwd)/my-config.yaml:/app/config.yaml your-image-name
    ```

#### Development with Docker Compose
For local development using Docker, the `docker-compose.yml` mounts the entire current directory to `/app`:
```yaml
volumes:
  - .:/app # Links the local source files to the running container
```
This allows for hot-reloading (via `npm run develop`) as you edit source files or data.

### Running the Image
Once pushed, anyone can run your vocabulary site:
```bash
docker run -p 8080:8000 your-dockerhub-username/my-vocab-site:latest
```
*Note: The default Dockerfile uses `npm run container-build` which runs `gatsby build`. For a production-ready serving container, you might want to multi-stage build the site and serve the `public/` folder with Nginx.*
