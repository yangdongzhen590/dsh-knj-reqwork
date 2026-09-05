import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, relative, resolve } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scanVueRouter } from '../lib/router-scan.js'

test('knsearch_web router scan lists real pages', () => {
  const pages = scanVueRouter('D:\\workspace\\knsearch-test\\knsearch_web')
  assert.ok(Array.isArray(pages) && pages.length >= 11, `expected >=11 pages, got ${pages.length}`)

  const paths = pages.map((page) => page.path)
  for (const path of ['/login', '/home', '/users', '/goods', '/orders', '/reports']) {
    assert.ok(paths.includes(path), `missing route ${path}`)
  }

  const goods = pages.find((page) => page.path === '/goods')
  assert.ok(goods && goods.file.includes('Goods.vue'), 'goods page must point at Goods.vue')
})

test('scans only routes-array entries and rejects component paths outside the project', () => {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'reqwork-router-scan-'))
  try {
    const routerDir = resolve(projectRoot, 'src/router')
    mkdirSync(routerDir, { recursive: true })
    writeFileSync(resolve(routerDir, 'index.js'), `
const metadata = {
  path: '/fake',
  component: () => import('../../../../outside.vue')
}
const routes = [
  {
    path: '/real',
    component: () => import('../views/Real.vue')
  },
  {
    path: '/escape',
    component: () => import('../../../../outside.vue')
  }
]
export default routes
`, 'utf8')

    const pages = scanVueRouter(projectRoot)
    assert.deepEqual(pages.map((page) => page.path), ['/real'])
    for (const page of pages) {
      const pathFromRoot = relative(projectRoot, page.file)
      assert.ok(pathFromRoot && !pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot), `escaped project root: ${page.file}`)
    }
  } finally {
    rmSync(projectRoot, { recursive: true, force: true })
  }
})
