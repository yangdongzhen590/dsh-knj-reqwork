import type { Context } from '@deepseek-ai/cordis'
import { BASE, makePagesHandler, type ReqworkConfig, type WebServerService } from './routes.js'

export const name = 'dsh-knj-reqwork'

export { scanVueRouter } from './router-scan.js'
export type { PageEntry } from './router-scan.js'
export { BASE, DEFAULT_PROJECT_ROOT, PAGES_PATH, makePagesHandler } from './routes.js'
export type { ReqworkConfig } from './routes.js'

export function mountReqworkRoutes(host: { webServer: WebServerService }, config?: ReqworkConfig): () => void {
  return host.webServer.register({
    kind: 'prefix',
    path: BASE,
    handler: makePagesHandler(config?.projectRoot),
  })
}

export function apply(ctx: Context, config?: ReqworkConfig): void {
  ctx.inject(['webServer'], (hostCtx: Context) => {
    return mountReqworkRoutes(hostCtx as Context & { webServer: WebServerService }, config)
  })
}
