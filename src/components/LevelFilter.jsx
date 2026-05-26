import { LEVELS } from '../data/categories.js'

export default function LevelFilter({ selectedLevels, onToggle }) {
  return (
    <div className="level-filter">
      {LEVELS.map(({ id, label, full }) => {
        const active = selectedLevels.has(id)
        return (
          <button
            key={id}
            title={full}
            className={`level-btn${active ? ` active-${id.toLowerCase()}` : ''}`}
            onClick={() => onToggle(id)}
          >
            <span className="level-btn-dot" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
