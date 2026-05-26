import { useState } from 'react'
import CategoryTree from './CategoryTree.jsx'
import LevelFilter from './LevelFilter.jsx'
import SmartSetsPanel from './SmartSetsPanel.jsx'
import { CATEGORIES } from '../data/categories.js'

export default function Sidebar({
  open,
  selectedIds, onToggleCategory,
  selectedLevels, onToggleLevel,
  smartCounts, onStartSmart,
  searchQuery, onSearchChange,
  searchResults,
  onPickSearchResult,
  onClose,
}) {
  const [showSearch, setShowSearch] = useState(false)

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

          {/* Search */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <div className="sidebar-section-label">Search</div>
              {showSearch && (
                <button className="sidebar-section-clear" onClick={() => { onSearchChange(''); setShowSearch(false) }}>Hide</button>
              )}
            </div>
            {!showSearch ? (
              <button className="sidebar-search-trigger" onClick={() => setShowSearch(true)}>
                🔍 Search questions…
              </button>
            ) : (
              <>
                <input
                  type="search"
                  autoFocus
                  className="sidebar-search-input"
                  placeholder="Keywords (e.g. Adler equation)"
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <div className="sidebar-search-results">
                    <div className="sidebar-search-summary">
                      {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
                    </div>
                    <ul>
                      {searchResults.slice(0, 30).map(q => (
                        <li key={q.id}>
                          <button
                            className="sidebar-search-item"
                            onClick={() => onPickSearchResult(q)}
                            title={q.question}
                          >
                            <span className="sidebar-search-item-title">
                              {String(q.question).slice(0, 60)}{q.question.length > 60 ? '…' : ''}
                            </span>
                            <span className="sidebar-search-item-meta">{q.level} · {q.path[1] ?? q.path[0]}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="sidebar-divider" />

          {/* Smart sets */}
          <div className="sidebar-section">
            <div className="sidebar-section-label">Smart sets</div>
            <SmartSetsPanel counts={smartCounts} onStart={onStartSmart} />
          </div>

          <div className="sidebar-divider" />

          {/* Categories */}
          <div className="sidebar-section">
            <div className="sidebar-section-label">Categories</div>
            <CategoryTree
              categories={CATEGORIES}
              selectedIds={selectedIds}
              onToggle={onToggleCategory}
            />
          </div>

          <div className="sidebar-divider" />

          {/* Difficulty */}
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
