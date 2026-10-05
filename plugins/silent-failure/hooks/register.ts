import type { Register } from 'claude-code'

// Silent Failure Detector
//
// A Bash call that exits non-zero already reaches Claude as an error
// (`isError: true` on the tool.call result). This mod looks at the other
// case: the call succeeded as far as the shell is concerned, but the output
// says something went wrong (failed tests, skipped tests, a traceback, an
// npm ERR!, a coverage threshold that was not met).
//
// Checked against claude-code.d.ts 2.1.289: the Bash result record has
// `stdout`, `stderr`, `interrupted`, `backgroundTaskId?` and
// `returnCodeInterpretation?`. It has no `exitCode` field; a non-zero exit
// shows up as `isError: true` on the tool.call result instead.

type Severity = 'high' | 'warning' | 'info'
type Mode = 'on' | 'strict' | 'off'

type Rule = {
  label: string
  pattern: RegExp
  severity: Severity
}

type Finding = {
  label: string
  severity: Severity
  line: string
}

type Report = {
  command: string
  at: number
  findings: Finding[]
  masking: string[]
}

// Counts are matched as 1 or more ([1-9]\d*), so "0 failed" and
// "0 skipped" in a passing summary are not reported.
const RULES: Rule[] = [
  // high: the output says the work did not succeed
  { label: 'failed tests or errors', pattern: /\b[1-9]\d*\s+(?:tests?\s+|specs?\s+|suites?\s+)?(?:failed|failing|failures?|errors?)\b/i, severity: 'high' },
  { label: 'FAIL / FAILED marker', pattern: /^\s*(?:FAIL|FAILED)\b|\bFAILED\b/m, severity: 'high' },
  { label: 'npm error', pattern: /^\s*npm (?:ERR!|error)\s/m, severity: 'high' },
  { label: 'Python traceback', pattern: /Traceback \(most recent call last\)/, severity: 'high' },
  { label: 'unhandled rejection or exception', pattern: /\bunhandled\s*(?:promise\s*)?(?:rejection|exception|error)\b/i, severity: 'high' },
  { label: 'error line', pattern: /^\s*(?:Error|TypeError|ReferenceError|SyntaxError|RangeError|ModuleNotFoundError|ImportError|AssertionError)\b[:\s]/m, severity: 'high' },
  { label: 'failed to load/compile/build', pattern: /\bfailed to (?:load|compile|build|connect|start|resolve|install|fetch)\b/i, severity: 'high' },
  { label: 'command or file not found', pattern: /\bcommand not found\b|\bNo such file or directory\b|\bPermission denied\b/i, severity: 'high' },
  { label: 'crash', pattern: /\bsegmentation fault\b|\bcore dumped\b|\bpanicked at\b|\bfatal error\b/i, severity: 'high' },

  // warning: the run may not have checked what it claims to
  { label: 'tests skipped or pending', pattern: /\b[1-9]\d*\s+(?:tests?\s+)?(?:skipped|pending|todo|xfail(?:ed)?)\b/i, severity: 'warning' },
  { label: 'no tests ran', pattern: /\bno tests? (?:found|ran|were found|to run|collected)\b|\bRan 0 tests\b|\bcollected 0 items\b/i, severity: 'warning' },
  { label: 'coverage threshold not met', pattern: /coverage[^\n]*threshold[^\n]*(?:not met|failed)|threshold[^\n]*not met/i, severity: 'warning' },
  { label: 'exception mentioned', pattern: /\bexception\b/i, severity: 'warning' },

  // info: reported only in strict mode
  { label: 'warning', pattern: /\bwarning\b|^\s*WARN\b/im, severity: 'info' },
  { label: 'deprecated API', pattern: /\bdeprecat(?:ed|ion)\b/i, severity: 'info' },
]

// Shell constructs that hide a failing exit code.
const MASKS: { label: string; pattern: RegExp }[] = [
  { label: '`|| true` swallows the exit code', pattern: /\|\|\s*(?:true|:)\b/ },
  { label: '`; true` / `; exit 0` overrides the exit code', pattern: /;\s*(?:true|exit\s+0)\s*$/ },
  { label: 'a pipe reports the last command\'s exit code', pattern: /\|\s*(?:tail|head|tee|grep|less|cat|sed|awk|sort|uniq|wc)\b/ },
]

const MAX_SCAN = 200_000
const MAX_LINE = 160

function scan(text: string, mode: Mode): Finding[] {
  const body = text.length > MAX_SCAN ? text.slice(-MAX_SCAN) : text
  const findings: Finding[] = []
  for (const rule of RULES) {
    if (rule.severity === 'info' && mode !== 'strict') continue
    const match = rule.pattern.exec(body)
    if (!match) continue
    findings.push({ label: rule.label, severity: rule.severity, line: lineAround(body, match.index) })
  }
  return findings
}

function lineAround(text: string, index: number): string {
  const start = text.lastIndexOf('\n', index) + 1
  const endAt = text.indexOf('\n', index)
  const line = text.slice(start, endAt === -1 ? undefined : endAt).trim()
  return line.length > MAX_LINE ? line.slice(0, MAX_LINE - 1) + '…' : line
}

function masksIn(command: string): string[] {
  return MASKS.filter(m => m.pattern.test(command)).map(m => m.label)
}

function shorten(command: string, max = 60): string {
  const one = command.replace(/\s+/g, ' ').trim()
  return one.length > max ? one.slice(0, max - 1) + '…' : one
}

function formatReport(report: Report): string {
  const lines = [
    '⚠ POSSIBLE SILENT FAILURE',
    `Command: ${shorten(report.command, 120)}`,
    'Exit code: 0 (the tool did not report an error)',
    'Detected:',
    ...report.findings.map(f => `  • [${f.severity}] ${f.label}: ${f.line}`),
  ]
  if (report.masking.length > 0) {
    lines.push('Exit code may be masked:', ...report.masking.map(m => `  • ${m}`))
  }
  return lines.join('\n')
}

function contextFor(report: Report, mode: Mode): string | undefined {
  const relevant = mode === 'strict' ? report.findings : report.findings.filter(f => f.severity === 'high')
  if (relevant.length === 0) return undefined
  const signs = relevant.map(f => `- ${f.label}: "${f.line}"`).join('\n')
  const mask = report.masking.length > 0 ? `\nThe command may hide its exit code (${report.masking.join('; ')}).` : ''
  return (
    'silent-failure: the Bash command exited 0, but its output shows signs of failure:\n' +
    signs +
    mask +
    '\nCheck these before you report this step as successful, or say why they do not matter.'
  )
}

function isMode(value: unknown): value is Mode {
  return value === 'on' || value === 'strict' || value === 'off'
}

const HELP = [
  '/silent-failure          show the mode and the last finding',
  '/silent-failure last     show the full last report (alias: inspect)',
  '/silent-failure strict   also flag warnings and deprecations; tell Claude about every finding',
  '/silent-failure on       default: flag failures and skipped tests; tell Claude about failures',
  '/silent-failure off      stop checking',
  '/silent-failure clear    clear the last report and the status line',
].join('\n')

export const register: Register = on => {
  // Module variables reset on each hot reload; $.store keeps them across.
  let mode: Mode = 'on'
  let last: Report | undefined

  on('session.start', async ($, e, next) => {
    const storedMode = await $.store.get('mode')
    if (isMode(storedMode)) mode = storedMode
    const storedLast = await $.store.get('last')
    if (storedLast && typeof storedLast === 'object') last = storedLast as Report
    await $.command.register({
      name: 'silent-failure',
      description: 'Inspect or configure detection of commands that exit 0 but failed',
      argumentHint: '[last|strict|on|off|clear]',
    })
    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (mode === 'off') return ran
    // A deny or a non-zero exit already reaches Claude as an error.
    if (ran.deny !== undefined || ran.isError === true) return ran

    const out = ran.result
    // Interrupted or backgrounded output is incomplete; judging it would mislead.
    if (out.interrupted || out.backgroundTaskId !== undefined) return ran

    const text = [out.stdout, out.stderr].filter(part => typeof part === 'string' && part.length > 0).join('\n')
    if (text.length === 0) return ran

    const findings = scan(text, mode)
    if (findings.length === 0) {
      $.ui.status(undefined)
      return ran
    }

    const report: Report = {
      command: e.command,
      at: await $.clock.now(),
      findings,
      masking: masksIn(e.command),
    }
    last = report
    await $.store.set('last', report)

    const high = findings.filter(f => f.severity === 'high').length
    const top = findings[0]?.label ?? 'suspicious output'
    $.ui.status(`⚠ exit 0 but ${high > 0 ? 'failure' : 'warning'}: ${top} · /silent-failure last`)
    $.ui.log(`silent-failure: ${shorten(e.command)} exited 0 but shows ${findings.map(f => f.label).join(', ')}`)

    const note = contextFor(report, mode)
    if (note === undefined) return ran
    return { ...ran, context: [...(ran.context ?? []), note] }
  })

  on('command.run', { command: 'silent-failure' }, async ($, e) => {
    const sub = e.args.trim().split(/\s+/)[0]?.toLowerCase() ?? ''

    if (sub === 'strict' || sub === 'on' || sub === 'off') {
      mode = sub
      await $.store.set('mode', mode)
      if (mode === 'off') $.ui.status(undefined)
      return { text: `mode: ${mode}` }
    }

    if (sub === 'clear') {
      last = undefined
      await $.store.delete('last')
      $.ui.status(undefined)
      return { text: 'last report cleared' }
    }

    if (sub === 'last' || sub === 'inspect') {
      return { text: last ? formatReport(last) : 'No suspicious success detected yet.' }
    }

    if (sub === '' ) {
      const summary = last
        ? `last: ${shorten(last.command)} → ${last.findings.map(f => f.label).join(', ')}`
        : 'last: none'
      return { text: `mode: ${mode}\n${summary}\n\n${HELP}` }
    }

    return { text: `Unknown option "${sub}".\n\n${HELP}` }
  })
}
