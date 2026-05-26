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
import integration    from './mathematics/integration.json'
import fourier        from './mathematics/fourier.json'
import eigenvalues    from './mathematics/eigenvalues.json'
import odes           from './mathematics/odes.json'

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
  ...integration,
  ...fourier,
  ...eigenvalues,
  ...odes,
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
