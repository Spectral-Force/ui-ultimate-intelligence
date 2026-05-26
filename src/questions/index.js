import dopplerCooling from './physics/doppler-cooling.json'
import mot from './physics/mot.json'
import rubidium from './physics/rubidium.json'
import quantumMechanics from './physics/quantum-mechanics.json'
import integration from './mathematics/integration.json'

export const allQuestions = [
  ...dopplerCooling,
  ...mot,
  ...rubidium,
  ...quantumMechanics,
  ...integration,
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
