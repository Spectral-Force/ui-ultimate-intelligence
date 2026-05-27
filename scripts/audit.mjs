#!/usr/bin/env node
/**
 * Question-bank auditor.
 *
 * Checks every JSON file in src/questions/ for:
 *   - Schema integrity (id, path, level, modes, passive.options/correct)
 *   - Duplicate question IDs across the whole bank
 *   - "Telling distractor" giveaway: correct option is markedly longer than
 *     all distractors (>2× the longest by default)
 *   - Unbalanced LaTeX delimiters
 *   - Out-of-range `correct` index
 *   - Empty / placeholder content
 *
 * Usage:
 *   node scripts/audit.mjs                # report + exit non-zero on failures
 *   node scripts/audit.mjs --quiet        # only print summary line
 *   node scripts/audit.mjs --json         # machine-readable output
 *   node scripts/audit.mjs --max-ratio=3  # change telling-distractor threshold
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const QUESTIONS_DIR = path.join(ROOT, 'src', 'questions')

const args = process.argv.slice(2)
const opt = {
  quiet: args.includes('--quiet'),
  json:  args.includes('--json'),
  maxRatio: 2.0,
}
for (const a of args) {
  const m = a.match(/^--max-ratio=(\d+(?:\.\d+)?)$/)
  if (m) opt.maxRatio = parseFloat(m[1])
}

async function walk(dir) {
  const out = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (entry.name.endsWith('.json')) out.push(full)
  }
  return out
}

function balancedDollars(s) {
  if (!s) return true
  let n = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && i + 1 < s.length) { i++; continue }
    if (s[i] === '$') {
      if (s[i + 1] === '$') { n += 2; i++; continue }
      n++
    }
  }
  return n % 2 === 0
}

function checkOne(q, file) {
  const issues = []
  // Schema
  for (const k of ['id', 'path', 'level', 'modes']) {
    if (!(k in q)) issues.push({ severity: 'error', code: 'missing-field', msg: `missing required field "${k}"` })
  }
  if (q.passive) {
    if (!Array.isArray(q.passive.options)) issues.push({ severity: 'error', code: 'bad-options', msg: 'passive.options not an array' })
    if (typeof q.passive.correct !== 'number' && !Array.isArray(q.passive.correctIndices))
      issues.push({ severity: 'error', code: 'bad-correct', msg: 'passive.correct must be number (or correctIndices array)' })
    if (typeof q.passive.correct === 'number') {
      if (q.passive.correct < 0 || q.passive.correct >= (q.passive.options?.length ?? 0))
        issues.push({ severity: 'error', code: 'correct-out-of-range', msg: `correct index ${q.passive.correct} out of range` })
    }
    // Telling distractor
    if (Array.isArray(q.passive.options) && typeof q.passive.correct === 'number') {
      const opts = q.passive.options
      const correct = opts[q.passive.correct]
      if (correct && opts.length >= 2) {
        const others = opts.filter((_, i) => i !== q.passive.correct)
        const longest = Math.max(...others.map(o => o.length))
        if (longest > 0 && correct.length > opt.maxRatio * longest) {
          issues.push({
            severity: 'warn',
            code: 'telling-distractor',
            msg: `correct option ${correct.length} chars vs longest distractor ${longest} chars (ratio ${(correct.length / longest).toFixed(1)}×)`,
          })
        }
      }
    }
  }
  // Balanced LaTeX
  for (const field of ['question', 'equation']) {
    if (q[field] && !balancedDollars(q[field])) {
      issues.push({ severity: 'error', code: 'unbalanced-dollars', msg: `unbalanced $ in ${field}` })
    }
  }
  if (q.passive?.explanation && !balancedDollars(q.passive.explanation)) {
    issues.push({ severity: 'error', code: 'unbalanced-dollars', msg: 'unbalanced $ in passive.explanation' })
  }
  // Empty content
  if (q.question && q.question.trim().length === 0) {
    issues.push({ severity: 'error', code: 'empty-question', msg: 'question is empty' })
  }
  // Placeholder markers
  const blob = JSON.stringify(q).toLowerCase()
  for (const marker of ['lorem', 'fixme', '???', 'tbd']) {
    if (blob.includes(marker)) issues.push({ severity: 'warn', code: 'placeholder', msg: `contains "${marker}"` })
  }
  return issues
}

async function main() {
  const files = await walk(QUESTIONS_DIR)
  const allIssues = []
  const ids = new Map()
  let total = 0
  for (const file of files) {
    const data = JSON.parse(await fs.readFile(file, 'utf8'))
    for (const q of data) {
      total++
      if (ids.has(q.id)) {
        allIssues.push({ file, qid: q.id, severity: 'error', code: 'duplicate-id', msg: `id also in ${ids.get(q.id)}` })
      } else {
        ids.set(q.id, file)
      }
      for (const issue of checkOne(q, file)) {
        allIssues.push({ file, qid: q.id, ...issue })
      }
    }
  }
  const errors = allIssues.filter(i => i.severity === 'error')
  const warns  = allIssues.filter(i => i.severity === 'warn')

  if (opt.json) {
    console.log(JSON.stringify({ total, files: files.length, errors, warns }, null, 2))
  } else if (opt.quiet) {
    console.log(`audit: ${total} questions / ${files.length} files / ${errors.length} errors / ${warns.length} warnings`)
  } else {
    for (const i of allIssues) {
      const rel = path.relative(ROOT, i.file)
      const sev = i.severity === 'error' ? 'ERR' : 'WARN'
      console.log(`  [${sev}] ${i.qid.padEnd(10)} ${rel.padEnd(46)} ${i.code}: ${i.msg}`)
    }
    console.log()
    console.log(`Total: ${total} questions across ${files.length} files`)
    console.log(`  ${errors.length} error(s), ${warns.length} warning(s)`)
  }

  // Non-zero exit only on errors; warnings (telling-distractor) are advisory.
  process.exit(errors.length === 0 ? 0 : 1)
}

main().catch(err => {
  console.error('audit failed:', err)
  process.exit(2)
})
