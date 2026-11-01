import type { Context } from '@deepseek-ai/cordis'
import { readFileSync } from 'node:fs'
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

/** 读自身 package.json 的版本号：启动日志是「插件到底加载了没有」的唯一信号。 */
function pluginVersion(): string {
  try {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version?: string }
    return manifest.version ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

export function apply(ctx: Context, config?: ReqworkConfig): void {
  // 这行日志是插件被宿主加载的唯一证据：没有它 = 没加载（例如 bundle 被静默跳过）。
  console.log(`[dsh-knj-reqwork] v${pluginVersion()} loaded (node ${process.version})`)
  ctx.inject(['webServer'], (hostCtx: Context) => {
    return mountReqworkRoutes(hostCtx as Context & { webServer: WebServerService }, config)
  })
}
