import CategoryTree from './CategoryTree.jsx'
import LevelFilter from './LevelFilter.jsx'
import { CATEGORIES } from '../data/categories.js'

export default function Sidebar({ open, selectedIds, onToggleCategory, selectedLevels, onToggleLevel, onClose }) {
  return (
    <>
      {open && <div className="sidebar-overlay visible" onClick={onClose} />}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">UI</div>
          <div>
            <div className="sidebar-logo-name">Ultimate Intelligence</div>
            <div className="sidebar-logo-tagline">Science & Mathematics</div>
          </div>
        </div>

        <div className="sidebar-scroll">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Categories</div>
            <CategoryTree
              categories={CATEGORIES}
              selectedIds={selectedIds}
              onToggle={onToggleCategory}
            />
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-section">
            <div className="sidebar-section-label">Difficulty level</div>
            <LevelFilter
              selectedLevels={selectedLevels}
              onToggle={onToggleLevel}
            />
          </div>
        </div>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Select categories above to begin a session. Hold multiple levels active to mix difficulties.
          </div>
        </div>
      </aside>
    </>
  )
}
