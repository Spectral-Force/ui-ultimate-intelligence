/**
 * Renders a question figure. Accepts:
 *   - { type: 'svg', markup: '<svg ...>...</svg>', caption?: string }
 *   - { type: 'image', src: 'data:image/png;base64,...' | 'url', caption?: string, alt?: string }
 *   - a plain string starting with '<svg' (treated as inline SVG)
 *   - a plain string starting with 'data:image/' or 'http(s)://' (image URL)
 */
export default function Figure({ figure }) {
  if (!figure) return null

  let kind = null
  let payload = null
  let caption = null
  let alt = ''

  if (typeof figure === 'string') {
    if (figure.trimStart().startsWith('<svg')) {
      kind = 'svg'; payload = figure
    } else if (/^data:image\//.test(figure) || /^https?:\/\//.test(figure) || figure.startsWith('/')) {
      kind = 'image'; payload = figure
    }
  } else if (typeof figure === 'object') {
    kind    = figure.type
    payload = figure.markup ?? figure.src
    caption = figure.caption
    alt     = figure.alt ?? figure.caption ?? ''
  }

  if (!payload) return null

  return (
    <figure className="question-figure">
      {kind === 'svg' ? (
        <div className="question-figure-svg" dangerouslySetInnerHTML={{ __html: payload }} />
      ) : (
        <img className="question-figure-img" src={payload} alt={alt} loading="lazy" />
      )}
      {caption && <figcaption className="question-figure-caption">{caption}</figcaption>}
    </figure>
  )
}
