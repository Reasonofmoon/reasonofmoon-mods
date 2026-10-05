import { expect, mock, test } from 'claude-code/testing'

type BashOut = { stdout: string; stderr: string; interrupted: boolean; backgroundTaskId?: string }

// The test's $ is the engine's own, so a command run carries what the engine stamps.
function sf(args: string) {
  return {
    command: 'silent-failure',
    args,
    origin: { kind: 'composer' as const },
    presentation: { isFullscreen: false, columns: 120 },
  }
}

function bash(out: Partial<BashOut>): { result: BashOut } {
  return { result: { stdout: '', stderr: '', interrupted: false, ...out } }
}

test('flags exit 0 with failed tests and tells Claude', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  mock.store(on)
  on('tool.call', () => bash({ stdout: 'Tests: 2 failed, 38 passed, 40 total' }))
  const ran = await $.tool.call({ tool: 'Bash', command: 'npm test | tail -n 20' })
  expect(ran.context?.join('\n') ?? '').toContain('failed tests or errors')

  const answer = await $.command.run(sf('last'))
  expect(answer.text).toContain('POSSIBLE SILENT FAILURE')
  expect(answer.text).toContain('2 failed')
  expect(answer.text).toContain('pipe')
})

test('ignores a clean run with zero counts', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  mock.store(on)
  on('tool.call', () => bash({ stdout: 'Tests: 0 failed, 0 skipped, 40 passed' }))
  const ran = await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect(ran.context).toBeUndefined()
  const answer = await $.command.run(sf('last'))
  expect(answer.text).toBe('No suspicious success detected yet.')
})

test('skipped tests are shown but not sent to Claude in default mode', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  mock.store(on)
  on('tool.call', () => bash({ stdout: '38 passed, 3 skipped' }))
  const ran = await $.tool.call({ tool: 'Bash', command: 'pytest' })
  expect(ran.context).toBeUndefined()
  const answer = await $.command.run(sf('last'))
  expect(answer.text).toContain('tests skipped or pending')
})

test('leaves errored calls alone', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  mock.store(on)
  on('tool.call', () => ({ isError: true as const, result: 'Exit code 1', text: 'Exit code 1\n1 failed' }))
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  const answer = await $.command.run(sf('last'))
  expect(answer.text).toBe('No suspicious success detected yet.')
})

test('strict mode adds deprecations; off mode stops checking', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  mock.store(on)
  on('tool.call', () => bash({ stderr: 'DeprecationWarning: Buffer() is deprecated' }))

  await $.command.run(sf('strict'))
  const strict = await $.tool.call({ tool: 'Bash', command: 'node app.js' })
  expect(strict.context?.join('\n') ?? '').toContain('deprecated API')

  await $.command.run(sf('clear'))
  await $.command.run(sf('off'))
  const off = await $.tool.call({ tool: 'Bash', command: 'node app.js' })
  expect(off.context).toBeUndefined()
  const answer = await $.command.run(sf(''))
  expect(answer.text).toContain('mode: off')
})
