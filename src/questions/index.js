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
]

export function filterQuestions(selectedIds, selectedLevels, mode) {
  if (selectedIds.size === 0) return []
  return allQuestions.filter(q => {
    if (!selectedLevels.has(q.level)) return false
    if (!q.path.some(id => selectedIds.has(id))) return false
    if (!q.modes.includes(mode)) return false
    return true
  })
}
