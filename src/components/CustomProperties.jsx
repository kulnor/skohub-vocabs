import { i18n } from "../common"

const CustomProperties = ({ properties, node, language }) => {
  if (!properties || !node) return null

  return (
    <>
      {properties.map((prop) => {
        const value = node[prop.id]
        if (!value) return null

        let renderedValue
        if (prop.type === "languageMap") {
          renderedValue = i18n(language)(value)
        } else if (prop.type === "languageMapArray") {
          const values = i18n(language)(value)
          if (Array.isArray(values) && values.length > 0) {
            renderedValue = (
              <ul>
                {values.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            )
          }
        } else {
          // string or fallback
          renderedValue = value
        }

        if (
          !renderedValue ||
          (Array.isArray(renderedValue) && renderedValue.length === 0)
        )
          return null

        return (
          <div className="custom-property" key={prop.id}>
            <h3>{prop.label}</h3>
            <div>{renderedValue}</div>
          </div>
        )
      })}
    </>
  )
}

export default CustomProperties
