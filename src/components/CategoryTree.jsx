import { useState } from 'react'
import { getAllDescendantIds, getNodeSelectionState } from '../data/categories.js'

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

  return (
    <li className="cat-node">
      <div
        className={`cat-row${state === 'selected' ? ' selected' : ''}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={handleRowClick}
      >
        <span
          className={`cat-arrow${hasChildren ? (expanded ? ' expanded' : '') : ' leaf'}`}
          onClick={hasChildren ? handleArrowClick : undefined}
        >
          ▶
        </span>
        <span className={`cat-dot ${state}`} />
        <span className="cat-label">{node.label}</span>
      </div>

      {hasChildren && expanded && (
        <ul className="cat-children">
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
    <ul className="cat-tree">
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
