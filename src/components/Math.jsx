import katex from 'katex'

export default function Math({ latex, display = false, className = '' }) {
  // KaTeX with throwOnError:false already returns rendered error markup —
  // no try/catch needed.
  const html = katex.renderToString(latex ?? '', {
    throwOnError: false,
    displayMode: display,
    errorColor: 'var(--incorrect)',
  })
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
