import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ReqworkPanel } from './ReqworkPanel.js'

const VIEW_SELECTOR = '[data-dsh-reqwork-view]'
const COLUMN_SELECTOR = '[data-pane="conversation"], [class*="centerCol"]'
const ACTIVE_ATTR = 'data-dsh-reqwork-active'
const ACTIVATE_EVENT = 'dsh-panel-activate'
const PANEL_NAME = 'reqwork'

const MOUNT_CSS = `
[data-pane='conversation'],[class*='centerCol']{position:relative}
${VIEW_SELECTOR}{position:absolute;inset:0;display:none;z-index:60;background:var(--dsw-alias-bg-base)}
html[${ACTIVE_ATTR}] ${VIEW_SELECTOR}{display:block}
html[${ACTIVE_ATTR}] [data-pane='conversation']>:not([data-dsh-reqwork-view]),html[${ACTIVE_ATTR}] [class*='centerCol']>:not([data-dsh-reqwork-view]){display:none!important}
.reqwork-panel{box-sizing:border-box;height:100%;overflow:auto;padding:16px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:inherit}
.reqwork-panel__header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.reqwork-panel__header h2,.reqwork-panel__header p{margin:0}.reqwork-panel__header h2{font-size:18px}.reqwork-panel__header p,.reqwork-panel__muted{color:var(--dsw-alias-label-secondary);font-size:13px}.reqwork-panel__header button{border:0;border-radius:6px;padding:6px 8px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer}.reqwork-panel__error{color:var(--dsw-alias-label-danger)}.reqwork-panel__list{margin:0;padding:0;list-style:none}.reqwork-panel__list li{margin-bottom:6px}.reqwork-panel__row{box-sizing:border-box;width:100%;padding:8px;border:1px solid var(--dsw-alias-border);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer}.reqwork-panel__row:hover{background:var(--dsw-alias-interactive-bg-hover)}.reqwork-panel__row[data-selected]{background:var(--dsw-alias-interactive-bg-active);border-color:var(--dsw-alias-interactive-bg-active)}.reqwork-panel__list code{color:var(--dsw-alias-label-primary)}.reqwork-panel__list span{display:block;margin-top:4px;color:var(--dsw-alias-label-secondary);font-size:12px}.reqwork-panel__inspector{margin-top:16px;padding:12px;border:1px solid var(--dsw-alias-border);border-radius:8px;background:var(--dsw-alias-bg-base)}.reqwork-panel__inspector h3{margin:0 0 8px;font-size:14px}.reqwork-panel__inspector dl{margin:0}.reqwork-panel__inspector dl div{display:grid;grid-template-columns:96px minmax(0,1fr);gap:8px;padding:4px 0}.reqwork-panel__inspector dt{color:var(--dsw-alias-label-secondary)}.reqwork-panel__inspector dd{min-width:0;margin:0;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
`

let styleElement: HTMLStyleElement | undefined
function ensureStyle(): void {
  if (styleElement !== undefined || typeof document === 'undefined') return
  styleElement = document.createElement('style')
  styleElement.setAttribute('data-dsh-reqwork-style', 'panel')
  styleElement.textContent = MOUNT_CSS
  document.head.appendChild(styleElement)
}

export function clearPanelStyle(): void {
  styleElement?.remove()
  styleElement = undefined
}

export interface PanelController {
  open(): void
  close(): void
  isOpen(): boolean
}

export function mountReqworkPanel(controller: PanelController): { dispose(): void } {
  if (typeof document === 'undefined') return { dispose() {} }
  ensureStyle()

  let root: Root | undefined
  let container: HTMLDivElement | undefined
  const ensure = (): void => {
    if (container?.isConnected) return
    root?.unmount()
    container?.remove()
    const column = document.querySelector<HTMLElement>(COLUMN_SELECTOR)
    if (column === null) return
    container = document.createElement('div')
    container.setAttribute('data-dsh-reqwork-view', '')
    container.setAttribute('data-dsh-plugin', 'dsh-knj-reqwork')
    column.appendChild(container)
    root = createRoot(container)
    root.render(createElement(ReqworkPanel, { onClose: () => controller.close() }))
  }

  const observer = new MutationObserver(ensure)
  observer.observe(document.body, { childList: true, subtree: true })
  const originalOpen = controller.open
  const originalClose = controller.close
  controller.open = () => {
    originalOpen.call(controller)
    document.documentElement.setAttribute(ACTIVE_ATTR, '')
    document.dispatchEvent(new CustomEvent(ACTIVATE_EVENT, { detail: PANEL_NAME }))
  }
  controller.close = () => {
    originalClose.call(controller)
    document.documentElement.removeAttribute(ACTIVE_ATTR)
  }
  const onOtherPanel = (event: Event): void => {
    if ((event as CustomEvent).detail !== PANEL_NAME && controller.isOpen()) controller.close()
  }
  document.addEventListener(ACTIVATE_EVENT, onOtherPanel)
  ensure()

  return {
    dispose() {
      document.removeEventListener(ACTIVATE_EVENT, onOtherPanel)
      observer.disconnect()
      controller.open = originalOpen
      controller.close = originalClose
      document.documentElement.removeAttribute(ACTIVE_ATTR)
      root?.unmount()
      container?.remove()
    },
  }
}
