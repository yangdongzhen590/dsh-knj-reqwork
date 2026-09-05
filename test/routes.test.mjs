import assert from 'node:assert/strict'
import { test } from 'node:test'
import { makePagesHandler } from '../lib/routes.js'
import { apply, mountReqworkRoutes } from '../lib/index.js'

function responseRecorder() {
  const result = { status: undefined, headers: undefined, body: undefined }
  return {
    result,
    writeHead(status, headers) {
      result.status = status
      result.headers = headers
    },
    end(body) {
      result.body = JSON.parse(body)
    },
  }
}

test('pages handler scans the configured root and ignores query root overrides', () => {
  const root = 'D:\\workspace\\knsearch-test\\knsearch_web'
  const handler = makePagesHandler(root)
  const response = responseRecorder()

  handler({ method: 'GET', url: '/dsh-knj-reqwork/pages?root=C:\\outside' }, response)

  assert.equal(response.result.status, 200)
  assert.deepEqual(response.result.headers, { 'content-type': 'application/json; charset=utf-8' })
  assert.equal(response.result.body.ok, true)
  assert.equal(response.result.body.root, root)
  assert.ok(response.result.body.pages.length >= 11)
})

test('pages handler rejects non-page paths with 404', () => {
  const response = responseRecorder()

  makePagesHandler()({ method: 'GET', url: '/dsh-knj-reqwork/other' }, response)

  assert.equal(response.result.status, 404)
  assert.deepEqual(response.result.body, { ok: false, error: 'not found' })
})

test('pages handler rejects non-GET requests with 405', () => {
  const response = responseRecorder()

  makePagesHandler()({ method: 'POST', url: '/dsh-knj-reqwork/pages' }, response)

  assert.equal(response.result.status, 405)
  assert.deepEqual(response.result.body, { ok: false, error: 'method not allowed' })
})

test('pages handler reports scanner failures with 500', () => {
  const response = responseRecorder()

  makePagesHandler('D:\\workspace\\does-not-exist')({ method: 'GET', url: '/dsh-knj-reqwork/pages' }, response)

  assert.equal(response.result.status, 500)
  assert.equal(response.result.body.ok, false)
  assert.match(response.result.body.error, /vue-router file not found/)
})

test('mountReqworkRoutes registers the BASE prefix and returns its cleanup', () => {
  const cleanup = () => undefined
  let route
  const host = {
    webServer: {
      register(value) {
        route = value
        return cleanup
      },
    },
  }

  assert.equal(mountReqworkRoutes(host, { projectRoot: 'D:\\workspace\\configured-root' }), cleanup)
  assert.equal(route.kind, 'prefix')
  assert.equal(route.path, '/dsh-knj-reqwork')
  assert.equal(typeof route.handler, 'function')
})

test('apply returns the registered route cleanup from its webServer injection', () => {
  const cleanup = () => undefined
  let injectedServices
  let injection
  const ctx = {
    inject(services, callback) {
      injectedServices = services
      injection = callback
    },
  }
  const host = {
    webServer: {
      register() {
        return cleanup
      },
    },
  }

  apply(ctx, { projectRoot: 'D:\\workspace\\configured-root' })

  assert.deepEqual(injectedServices, ['webServer'])
  assert.equal(injection(host), cleanup)
})
