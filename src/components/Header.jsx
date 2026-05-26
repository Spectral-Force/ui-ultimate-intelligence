export default function Header({ theme, onToggleTheme, selectedIds, selectedLevels, onMenuOpen }) {
  const catCount = selectedIds.size
  const levelsArr = [...selectedLevels]

  return (
    <header className="header">
      <button className="header-menu-btn" onClick={onMenuOpen} aria-label="Open menu">
        ☰
      </button>

      <div className="header-context">
        {catCount === 0 ? (
          <span className="header-context-text">Choose categories from the sidebar to begin</span>
        ) : (
          <span className="header-context-text">
            <strong>{catCount} {catCount === 1 ? 'category' : 'categories'} selected</strong>
            {levelsArr.length > 0 && (
              <> &nbsp;·&nbsp; {levelsArr.map(l => (
                <span key={l} className="header-context-pill" style={{ marginRight: 4 }}>{l}</span>
              ))}</>
            )}
          </span>
        )}
      </div>

      <div className="header-actions">
        <button className="theme-btn" onClick={onToggleTheme}>
          {theme === 'dark' ? '☀ Cream' : '◗ Dark'}
        </button>
      </div>
    </header>
  )
}
