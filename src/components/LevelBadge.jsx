const LABELS = { U: 'Undergrad', M: "Master's", P: 'PhD', A: 'Academic' }

export default function LevelBadge({ level }) {
  return (
    <span className={`level-badge ${level}`} title={LABELS[level]}>
      {level}
    </span>
  )
}
