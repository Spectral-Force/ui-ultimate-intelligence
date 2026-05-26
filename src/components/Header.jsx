export default function Header({ theme, onToggleTheme, selectedLeafCount, selectedLevels, onMenuOpen }) {
  const catCount = selectedLeafCount ?? 0
  const levelsArr = [...selectedLevels]

  return (
    <header className="header">
      <button
        className="header-menu-btn"
        onClick={onMenuOpen}
        aria-label="Open category menu"
      >
        ☰
      </button>

      <div className="header-context">
        {catCount === 0 ? (
          <span className="header-context-text">Choose categories from the sidebar to begin</span>
        ) : (
          <span className="header-context-text">
            <strong>{catCount} {catCount === 1 ? 'topic' : 'topics'} selected</strong>
            {levelsArr.length > 0 && (
              <> &nbsp;·&nbsp; {levelsArr.map(l => (
                <span key={l} className="header-context-pill" style={{ marginRight: 4 }}>{l}</span>
              ))}</>
            )}
          </span>
        )}
      </div>

      <div className="header-actions">
        <button
          className="theme-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'cream' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'cream' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀ Cream' : '◗ Dark'}
        </button>
      </div>
    </header>
  )
}
