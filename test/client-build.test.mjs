import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import vm from 'node:vm'

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

test('deferred slot registration failure tears down the already-mounted client resources', () => {
  const bundle = readFileSync(resolve(ROOT, 'client/client.js'), 'utf8')
  let deferredCallback
  const resources = { styles: 0, containers: 0, roots: 0, observers: 0, listeners: 0 }
  const document = {
    head: { appendChild: () => { resources.styles += 1 } },
    body: {},
    documentElement: { setAttribute() {}, removeAttribute() {} },
    createElement: () => {
      let kind
      return {
        setAttribute: (name) => { if (name === 'data-dsh-reqwork-style') kind = 'style'; if (name === 'data-dsh-reqwork-view') kind = 'container' },
        remove: () => { if (kind === 'style') resources.styles -= 1; if (kind === 'container') resources.containers -= 1 },
      }
    },
    querySelector: () => ({ appendChild: () => { resources.containers += 1 } }),
    addEventListener: () => { resources.listeners += 1 },
    removeEventListener: () => { resources.listeners -= 1 },
    dispatchEvent() {},
  }
  const require = (id) => {
    if (id === 'react') return { createElement: () => ({}) }
    if (id === 'react/jsx-runtime') return { jsx: () => ({}) }
    if (id === 'react-dom/client') return { createRoot: () => { resources.roots += 1; return { render() {}, unmount() { resources.roots -= 1 } } } }
    throw new Error(`unexpected module ${id}`)
  }
  class MutationObserver {
    constructor() { resources.observers += 1 }
    observe() {}
    disconnect() { resources.observers -= 1 }
  }
  const moduleLoader = { load: ({ factory }) => { moduleLoader.exports = factory(require) } }
  vm.runInNewContext(bundle, { window: { __ModuleLoader__: moduleLoader }, document, MutationObserver, CustomEvent: class {} })

  const dispose = moduleLoader.exports.apply({
    slots: {
      inject: (_slot, callback) => { deferredCallback = callback; return () => {} },
      register: () => { throw new Error('deferred register failure') },
    },
  })
  assert.equal(typeof dispose, 'function')
  assert.equal(resources.observers, 1)
  assert.equal(resources.listeners, 1)
  assert.equal(resources.roots, 1)
  assert.equal(resources.styles, 1)

  assert.throws(() => deferredCallback(), /deferred register failure/)
  assert.deepEqual(resources, { styles: 0, containers: 0, roots: 0, observers: 0, listeners: 0 })
})
