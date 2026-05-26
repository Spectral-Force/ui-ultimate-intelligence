import katex from 'katex'

export default function Math({ latex, display = false, className = '' }) {
  let html = ''
  try {
    html = katex.renderToString(latex, { throwOnError: false, displayMode: display })
  } catch {
    html = `<span style="color:var(--incorrect)">[parse error]</span>`
  }
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
