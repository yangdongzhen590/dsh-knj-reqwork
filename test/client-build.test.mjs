import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const ROOT = resolve(import.meta.dirname, '..')

test('client build registers the reqwork ModuleLoader bundle', () => {
  const client = resolve(ROOT, 'client/client.js')
  assert.ok(existsSync(client), 'client/client.js must exist after npm run build')

  const bundle = readFileSync(client, 'utf8')
  assert.match(bundle, /window\.__ModuleLoader__\.load\(\{\s*id: "dsh-knj-reqwork"/)
  assert.match(bundle, /apply/)
})

test('client source is not ignored and supports cleanup-safe panel lifecycle', () => {
  const ignore = readFileSync(resolve(ROOT, '.gitignore'), 'utf8')
  assert.ok(!ignore.split(/\r?\n/).includes('client/'), 'src/client must not be ignored')

  const entry = readFileSync(resolve(ROOT, 'src/client/index.ts'), 'utf8')
  assert.match(entry, /mount\.dispose\(\)/)
  assert.match(entry, /catch \(error\)[\s\S]*mount\.dispose\(\)/)
  assert.match(entry, /clearMenuStyle\(\)/)
  assert.match(entry, /clearPanelStyle\(\)/)

  const panel = readFileSync(resolve(ROOT, 'src/client/ReqworkPanel.tsx'), 'utf8')
  assert.match(panel, /AbortController/)
  assert.match(panel, /controller\.abort\(\)/)
})

test('client page rows retain a PageRef selection and show source inspection details', () => {
  const panel = readFileSync(resolve(ROOT, 'src/client/ReqworkPanel.tsx'), 'utf8')
  const mount = readFileSync(resolve(ROOT, 'src/client/panel-mount.tsx'), 'utf8')

  assert.match(panel, /useState<PageEntry \| null>\(null\)/)
  assert.match(panel, /setSelectedPage\(page\)/)
  assert.match(panel, /@page:\$\{selectedPage\.path\}/)
  assert.match(panel, /组件来源/)
  assert.match(panel, /布局/)
  assert.match(mount, /reqwork-panel__row\[data-selected\]/)
})
