import { useState } from 'react'
import { getNodeSelectionState } from '../data/categories.js'

function CategoryNode({ node, selectedIds, onToggle, depth }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = !!node.children?.length
  const state = getNodeSelectionState(node, selectedIds)

  function handleRowClick(e) {
    e.stopPropagation()
    onToggle(node, state)
  }

  function handleArrowClick(e) {
    e.stopPropagation()
    setExpanded(v => !v)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle(node, state)
    } else if (hasChildren && e.key === 'ArrowRight' && !expanded) {
      e.preventDefault()
      setExpanded(true)
    } else if (hasChildren && e.key === 'ArrowLeft' && expanded) {
      e.preventDefault()
      setExpanded(false)
    }
  }

  return (
    <li className="cat-node">
      <div
        className={`cat-row${state === 'selected' ? ' selected' : ''}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
        role="treeitem"
        tabIndex={0}
        aria-selected={state === 'selected'}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-label={`${node.label}${state === 'selected' ? ' (selected)' : state === 'partial' ? ' (partially selected)' : ''}`}
      >
        <span
          className={`cat-arrow${hasChildren ? (expanded ? ' expanded' : '') : ' leaf'}`}
          onClick={hasChildren ? handleArrowClick : undefined}
          aria-hidden="true"
        >
          ▶
        </span>
        <span className={`cat-dot ${state}`} aria-hidden="true" />
        <span className="cat-label">{node.label}</span>
      </div>

      {hasChildren && expanded && (
        <ul className="cat-children" role="group">
          {node.children.map(child => (
            <CategoryNode
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function CategoryTree({ categories, selectedIds, onToggle }) {
  return (
    <ul className="cat-tree" role="tree" aria-label="Question categories">
      {categories.map(node => (
        <CategoryNode
          key={node.id}
          node={node}
          selectedIds={selectedIds}
          onToggle={onToggle}
          depth={0}
        />
      ))}
    </ul>
  )
}
