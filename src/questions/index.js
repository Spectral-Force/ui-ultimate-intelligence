import dopplerCooling  from './physics/doppler-cooling.json'
import mot            from './physics/mot.json'
import rubidium       from './physics/rubidium.json'
import quantumMechanics from './physics/quantum-mechanics.json'
import perturbation   from './physics/perturbation.json'
import scattering     from './physics/scattering.json'
import bec            from './physics/bec.json'
import subDoppler     from './physics/sub-doppler.json'
import maxwells       from './physics/maxwells.json'
import lagrangian     from './physics/lagrangian.json'
import hamiltonian    from './physics/hamiltonian.json'
import entropy        from './physics/entropy.json'
import ensembles      from './physics/ensembles.json'
import spectroscopy   from './physics/spectroscopy.json'
import laserTrapping  from './physics/laser-trapping.json'
import optics         from './physics/optics.json'
import photonStats    from './physics/photon-stats.json'
import qubits         from './physics/qubits.json'
import entanglement   from './physics/entanglement.json'
import decoherence    from './physics/decoherence.json'
import integration    from './mathematics/integration.json'
import fourier        from './mathematics/fourier.json'
import eigenvalues    from './mathematics/eigenvalues.json'
import odes           from './mathematics/odes.json'
import differentiation from './mathematics/differentiation.json'
import complexAnalysis from './mathematics/complex-analysis.json'
import vectorCalculus from './mathematics/vector-calculus.json'
import probability    from './mathematics/probability.json'
import multivariable  from './mathematics/multivariable.json'
import cavityQed      from './physics/cavity-qed.json'
import squeezedLight  from './physics/squeezed-light.json'
import fermiGases     from './physics/fermi-gases.json'
import pdes           from './mathematics/pdes.json'
import groupTheory    from './mathematics/group-theory.json'
import linearTransforms from './mathematics/linear-transforms.json'
import innerProducts  from './mathematics/inner-products.json'
import cesium         from './physics/cesium.json'
import lithium        from './physics/lithium.json'
import strontium      from './physics/strontium.json'
import ytterbium      from './physics/ytterbium.json'
import phaseTransitions from './physics/phase-transitions.json'
import emWaves        from './physics/em-waves.json'
import oscillations   from './physics/oscillations.json'
import radiation      from './physics/radiation.json'
import mathieuEquations from './physics/mathieu-equations.json'
import paulTraps      from './physics/paul-traps.json'
import keyQuantities  from './physics/key-quantities.json'
import vacuumPhysics  from './physics/vacuum-physics.json'
import uhv            from './physics/uhv.json'
import bakeout        from './physics/bakeout.json'
import laserSystems   from './physics/laser-systems.json'
import electronics    from './physics/electronics.json'
import ehrenfest               from './physics/ehrenfest.json'
import virial                  from './physics/virial.json'
import hellmannFeynman         from './physics/hellmann-feynman.json'
import noetherTh               from './physics/noether.json'
import bellChsh                from './physics/bell-chsh.json'
import noCloning               from './physics/no-cloning.json'
import wignerEckart            from './physics/wigner-eckart.json'
import adiabaticTheorem        from './physics/adiabatic-theorem.json'
import fluctuationDissipation  from './physics/fluctuation-dissipation.json'
import opticalTheorem          from './physics/optical-theorem.json'
import spinStatistics          from './physics/spin-statistics.json'
import cptTheorem              from './physics/cpt-theorem.json'

export const allQuestions = [
  ...dopplerCooling,
  ...mot,
  ...rubidium,
  ...quantumMechanics,
  ...perturbation,
  ...scattering,
  ...bec,
  ...subDoppler,
  ...maxwells,
  ...lagrangian,
  ...hamiltonian,
  ...entropy,
  ...ensembles,
  ...spectroscopy,
  ...laserTrapping,
  ...optics,
  ...photonStats,
  ...qubits,
  ...entanglement,
  ...decoherence,
  ...integration,
  ...fourier,
  ...eigenvalues,
  ...odes,
  ...differentiation,
  ...complexAnalysis,
  ...vectorCalculus,
  ...probability,
  ...multivariable,
  ...cavityQed,
  ...squeezedLight,
  ...fermiGases,
  ...pdes,
  ...groupTheory,
  ...linearTransforms,
  ...innerProducts,
  ...cesium,
  ...lithium,
  ...strontium,
  ...ytterbium,
  ...phaseTransitions,
  ...emWaves,
  ...oscillations,
  ...radiation,
  ...mathieuEquations,
  ...paulTraps,
  ...keyQuantities,
  ...vacuumPhysics,
  ...uhv,
  ...bakeout,
  ...laserSystems,
  ...electronics,
  ...ehrenfest,
  ...virial,
  ...hellmannFeynman,
  ...noetherTh,
  ...bellChsh,
  ...noCloning,
  ...wignerEckart,
  ...adiabaticTheorem,
  ...fluctuationDissipation,
  ...opticalTheorem,
  ...spinStatistics,
  ...cptTheorem,
]

/**
 * Runtime-merged question bank: built-in JSON + user-authored from Dexie.
 * Components should prefer `useAllQuestions()` (from hooks/useAllQuestions.js)
 * to get the live-updating list; `allQuestions` here is the static fallback.
 */
let _userQuestions = []
const _listeners = new Set()

export function setUserQuestions(list) {
  _userQuestions = Array.isArray(list) ? list : []
  _listeners.forEach(l => l(getAllQuestionsLive()))
}

export function getAllQuestionsLive() {
  if (_userQuestions.length === 0) return allQuestions
  // De-dupe by id: user-authored wins
  const byId = new Map(allQuestions.map(q => [q.id, q]))
  for (const q of _userQuestions) byId.set(q.id, q)
  return [...byId.values()]
}

export function subscribeQuestions(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

export function filterQuestions(selectedIds, selectedLevels, mode) {
  if (selectedIds.size === 0) return []
  return getAllQuestionsLive().filter(q => {
    if (!selectedLevels.has(q.level)) return false
    if (!q.path.some(id => selectedIds.has(id))) return false
    if (!q.modes.includes(mode)) return false
    return true
  })
}
