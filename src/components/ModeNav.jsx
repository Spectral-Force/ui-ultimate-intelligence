const TABS = [
  { id: 'passive', icon: '◎', label: 'Passive' },
  { id: 'active',  icon: '⟡', label: 'Active' },
  { id: 'stats',   icon: '▦',  label: 'Stats' },
]

export default function ModeNav({ activeMode, onSelect }) {
  return (
    <nav className="mode-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`mode-tab${activeMode === tab.id ? ' active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          <span className="mode-tab-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
