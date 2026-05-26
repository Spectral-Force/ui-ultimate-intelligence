import Math from './Math.jsx'

// Renders a string that may contain $inline math$ segments.
export default function RichText({ text }) {
  if (!text) return null
  const parts = text.split(/\$([^$]+)\$/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 0
          ? <span key={i}>{part}</span>
          : <Math key={i} latex={part} />
      )}
    </>
  )
}
