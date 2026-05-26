import { useEffect, useState } from 'react'
import { getAllQuestionsLive, subscribeQuestions } from '../questions/index.js'

/**
 * Live-updating list of all questions (built-in + user-authored).
 * Re-renders whenever the user-questions list changes.
 */
export function useAllQuestions() {
  const [list, setList] = useState(getAllQuestionsLive)
  useEffect(() => subscribeQuestions(setList), [])
  return list
}
