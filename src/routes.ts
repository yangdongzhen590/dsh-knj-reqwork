import type { IncomingMessage, ServerResponse } from 'node:http'
import { scanVueRouter, type PageEntry } from './router-scan.js'

export interface ReqworkConfig {
  projectRoot?: string
}

export const BASE = '/dsh-knj-reqwork'
export const PAGES_PATH = `${BASE}/pages`
export const DEFAULT_PROJECT_ROOT = 'D:\\workspace\\knsearch-test\\knsearch_web'

type JsonPayload = { ok: true, root: string, pages: PageEntry[] } | { ok: false, error: string }

function sendJson(response: ServerResponse, status: number, payload: JsonPayload): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

export interface WebServerService {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>
  }): () => void
}

export function makePagesHandler(projectRoot = DEFAULT_PROJECT_ROOT) {
  return (request: IncomingMessage, response: ServerResponse): void => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
    if (pathname !== PAGES_PATH) {
      sendJson(response, 404, { ok: false, error: 'not found' })
      return
    }
    if (request.method !== 'GET') {
      sendJson(response, 405, { ok: false, error: 'method not allowed' })
      return
    }

    try {
      const pages = scanVueRouter(projectRoot)
      sendJson(response, 200, { ok: true, root: projectRoot, pages })
    } catch (error) {
      sendJson(response, 500, { ok: false, error: (error as Error).message })
    }
  }
}
