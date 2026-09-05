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
