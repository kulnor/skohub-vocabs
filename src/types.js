module.exports = (languages, config) => {
  const customFields = (className) => {
    return config.custom_properties
      .filter((prop) => prop.classes.includes(className))
      .map((prop) => {
        let type = "String"
        if (prop.type === "languageMap") type = "LanguageMap"
        if (prop.type === "languageMapArray") type = "LanguageMapArray"
        return `${prop.id}: ${type}`
      })
      .join(", ")
  }

  const customFieldsString = (className) => {
    const fields = customFields(className)
    return fields ? `, ${fields}` : ""
  }

  return `

  type Collection implements Node {
    type: String,
    prefLabel: LanguageMap,
    member: [Concept] @link(from: "member___NODE")${customFieldsString(
      "Collection"
    )}
  }

  type ConceptScheme implements Node {
    type: String,
    title: LanguageMap,
    dc_title: LanguageMap,
    prefLabel: LanguageMap,
    description: LanguageMap,
    dc_description: LanguageMap,
    hasTopConcept: [Concept] @link(from: "hasTopConcept___NODE"),
    languages: [String],
    issued: String,
    preferredNamespaceUri: String,
    preferredNamespacePrefix: String,
    publisher: Concept${customFieldsString("ConceptScheme")}
  }

  type Concept implements Node {
    type: String,
    prefLabel: LanguageMap,
    altLabel: LanguageMapArray,
    hiddenLabel: LanguageMapArray,
    definition: LanguageMap,
    note: LanguageMapArray,
    changeNote: LanguageMapArray,
    editorialNote: LanguageMapArray,
    historyNote: LanguageMapArray,
    scopeNote: LanguageMapArray,
    notation: [String],
    example: LanguageMap,
    topConceptOf: [ConceptScheme] @link(from: "topConceptOf___NODE"),
    narrower: [Concept] @link(from: "narrower___NODE"),
    narrowerTransitive: [Concept] @link(from: "narrowerTransitive___NODE"),
    narrowMatch: [Concept],
    broader: Concept @link(from: "broader___NODE"),
    broaderTransitive: [Concept] @link(from: "broaderTransitive___NODE"),
    broadMatch: [Concept],
    related: [Concept] @link(from: "related___NODE"),
    relatedMatch: [Concept],
    closeMatch: [Concept],
    exactMatch: [Concept],
    inScheme: [ConceptScheme] @link(from: "inScheme___NODE"),
    inSchemeAll: [ConceptScheme],
    hub: String,
    deprecated: Boolean,
    isReplacedBy: [Concept]${customFieldsString("Concept")}
  }

  type LanguageMap {
    ${
      languages.size > 0
        ? [...languages].map((l) => `${l}: String`).join(", ")
        : "en: String"
    }
  }
  
  type LanguageMapArray {
    ${
      languages.size > 0
        ? [...languages].map((l) => `${l}: [String]`).join(", ")
        : "en: [String]"
    }
  }
`
}
