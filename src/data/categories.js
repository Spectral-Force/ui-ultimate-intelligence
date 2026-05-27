export const CATEGORIES = [
  {
    id: 'physics',
    label: 'Physics',
    children: [
      {
        id: 'quantum-mechanics',
        label: 'Quantum Mechanics',
        children: [
          {
            id: 'atomic-physics',
            label: 'Atomic Physics',
            children: [
              {
                id: 'laser-cooling',
                label: 'Laser Cooling',
                children: [
                  { id: 'doppler-cooling',  label: 'Doppler Cooling' },
                  { id: 'sub-doppler',      label: 'Sub-Doppler Cooling' },
                  { id: 'mot',              label: 'Magneto-Optical Traps' },
                  { id: 'laser-trapping',   label: 'Optical Dipole Traps' },
                ],
              },
              {
                id: 'ultracold-atoms',
                label: 'Ultracold Atoms',
                children: [
                  { id: 'bec',         label: 'Bose-Einstein Condensation' },
                  { id: 'fermi-gases', label: 'Degenerate Fermi Gases' },
                ],
              },
              {
                id: 'elements',
                label: 'Specific Elements',
                children: [
                  { id: 'rubidium',  label: 'Rubidium' },
                  { id: 'cesium',    label: 'Cesium' },
                  { id: 'lithium',   label: 'Lithium' },
                  { id: 'strontium', label: 'Strontium' },
                  { id: 'ytterbium', label: 'Ytterbium' },
                ],
              },
              { id: 'spectroscopy', label: 'Spectroscopy' },
            ],
          },
          {
            id: 'quantum-optics',
            label: 'Quantum Optics',
            children: [
              { id: 'cavity-qed',      label: 'Cavity QED' },
              { id: 'squeezed-light',  label: 'Squeezed Light' },
              { id: 'photon-stats',    label: 'Photon Statistics' },
            ],
          },
          {
            id: 'quantum-info',
            label: 'Quantum Information',
            children: [
              { id: 'qubits',       label: 'Qubits & Gates' },
              { id: 'entanglement', label: 'Entanglement' },
              { id: 'decoherence',  label: 'Decoherence' },
            ],
          },
          { id: 'scattering-theory', label: 'Scattering Theory' },
          { id: 'perturbation',      label: 'Perturbation Theory' },
        ],
      },
      {
        id: 'electromagnetism',
        label: 'Electromagnetism',
        children: [
          { id: 'maxwells-equations', label: "Maxwell's Equations" },
          { id: 'em-waves',           label: 'EM Waves & Propagation' },
          { id: 'radiation',          label: 'Radiation & Antennas' },
          { id: 'mathieu-equations',  label: 'Mathieu Equations' },
          { id: 'paul-traps',         label: 'Paul Traps & Ion Trapping' },
        ],
      },
      {
        id: 'classical-mechanics',
        label: 'Classical Mechanics',
        children: [
          { id: 'lagrangian',  label: 'Lagrangian Mechanics' },
          { id: 'hamiltonian', label: 'Hamiltonian Mechanics' },
          { id: 'oscillations', label: 'Oscillations & Waves' },
        ],
      },
      {
        id: 'statistical-mechanics',
        label: 'Statistical Mechanics',
        children: [
          { id: 'entropy',    label: 'Entropy & Thermodynamics' },
          { id: 'ensembles',  label: 'Statistical Ensembles' },
          { id: 'phase-transitions', label: 'Phase Transitions' },
        ],
      },
      { id: 'optics', label: 'Optics' },
      { id: 'key-quantities', label: 'Key Quantities & Constants' },
      {
        id: 'named-quantities',
        label: 'Named Quantities & Constants',
        children: [
          { id: 'dimensionless-numbers', label: 'Dimensionless Numbers' },
          { id: 'fundamental-constants', label: 'Fundamental Constants' },
          { id: 'length-scales',         label: 'Length Scales' },
          { id: 'time-scales',           label: 'Time Scales' },
          { id: 'atomic-notation',       label: 'Atomic Notation & Term Symbols' },
        ],
      },
      {
        id: 'theorems',
        label: 'Theorems & Principles',
        children: [
          { id: 'ehrenfest',               label: "Ehrenfest's Theorem" },
          { id: 'virial',                  label: 'Virial Theorem' },
          { id: 'hellmann-feynman',        label: 'Hellmann-Feynman Theorem' },
          { id: 'noether',                 label: "Noether's Theorem" },
          { id: 'bell-chsh',               label: 'Bell / CHSH Inequalities' },
          { id: 'no-cloning',              label: 'No-Cloning Theorem' },
          { id: 'wigner-eckart',           label: 'Wigner-Eckart Theorem' },
          { id: 'adiabatic-theorem',       label: 'Adiabatic Theorem & Berry Phase' },
          { id: 'fluctuation-dissipation', label: 'Fluctuation-Dissipation' },
          { id: 'optical-theorem',         label: 'Optical Theorem' },
          { id: 'spin-statistics',         label: 'Spin-Statistics Theorem' },
          { id: 'cpt-theorem',             label: 'CPT Theorem' },
        ],
      },
      {
        id: 'equipment',
        label: 'Lab Equipment & Techniques',
        children: [
          {
            id: 'vacuum-systems',
            label: 'Vacuum Systems',
            children: [
              { id: 'vacuum-physics', label: 'Vacuum Physics & Gauges' },
              { id: 'uhv',            label: 'Ultra-High Vacuum' },
              { id: 'bakeout',        label: 'Bakeout Procedures' },
            ],
          },
          { id: 'laser-systems',  label: 'Laser Systems & Locking' },
          { id: 'electronics',    label: 'Electronics & Signal Processing' },
        ],
      },
    ],
  },
  {
    id: 'mathematics',
    label: 'Mathematics',
    children: [
      {
        id: 'calculus',
        label: 'Calculus',
        children: [
          { id: 'integration',       label: 'Integration' },
          { id: 'differentiation',   label: 'Differentiation' },
          { id: 'multivariable',     label: 'Multivariable Calculus' },
          { id: 'vector-calculus',   label: 'Vector Calculus' },
        ],
      },
      {
        id: 'linear-algebra',
        label: 'Linear Algebra',
        children: [
          { id: 'eigenvalues',      label: 'Eigenvalues & Eigenvectors' },
          { id: 'linear-transforms', label: 'Linear Transformations' },
          { id: 'inner-products',   label: 'Inner Product Spaces' },
        ],
      },
      {
        id: 'differential-equations',
        label: 'Differential Equations',
        children: [
          { id: 'odes',  label: 'Ordinary DEs' },
          { id: 'pdes',  label: 'Partial DEs' },
        ],
      },
      { id: 'fourier-analysis',  label: 'Fourier Analysis' },
      { id: 'group-theory',      label: 'Group Theory' },
      { id: 'complex-analysis',  label: 'Complex Analysis' },
      { id: 'probability',       label: 'Probability & Statistics' },
    ],
  },
]

export const LEVELS = [
  { id: 'U', label: 'Undergrad',  full: 'Undergraduate' },
  { id: 'M', label: 'Masters',    full: "Master's" },
  { id: 'P', label: 'PhD',        full: 'PhD' },
  { id: 'A', label: 'Academic',   full: 'Academic / Postdoc' },
]

export function getAllDescendantIds(node) {
  if (!node.children) return [node.id]
  return [node.id, ...node.children.flatMap(getAllDescendantIds)]
}

// True if node is a leaf (no children) — used to count "real" topic selections
export function isLeaf(node) {
  return !node.children || node.children.length === 0
}

export function getNodeSelectionState(node, selectedIds) {
  if (!node.children) return selectedIds.has(node.id) ? 'selected' : 'unselected'
  const childStates = node.children.map(c => getNodeSelectionState(c, selectedIds))
  if (childStates.every(s => s === 'selected')) return 'selected'
  if (childStates.some(s => s !== 'unselected')) return 'partial'
  return 'unselected'
}
