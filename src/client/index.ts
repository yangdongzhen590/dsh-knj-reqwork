import { applyGuard } from './apply-guard.js'
import { clearMenuStyle, registerMenuEntry, type SlotsLike } from './menu-entry.js'
import { clearPanelStyle, mountReqworkPanel, type PanelController } from './panel-mount.js'

export interface ReqworkClientContext {
  slots?: SlotsLike
}

export const inject = ['slots']

function createController(): PanelController {
  let open = false
  return {
    open: () => { open = true },
    close: () => { open = false },
    isOpen: () => open,
  }
}

export function apply(ctx: ReqworkClientContext): (() => void) | undefined {
  return applyGuard(() => {
    const controller = createController()
    const mount = mountReqworkPanel(controller)
    let entryDispose: (() => void) | undefined
    let disposed = false
    const dispose = (): void => {
      if (disposed) return
      disposed = true
      try { entryDispose?.() } catch (error) { console.warn('[dsh-knj-reqwork] menu disposer failed:', error) }
      mount.dispose()
      clearMenuStyle()
      clearPanelStyle()
    }

    try {
      const toggle = (): void => {
        if (controller.isOpen()) controller.close()
        else controller.open()
      }
      const slots = ctx?.slots
      entryDispose = typeof slots?.inject === 'function'
        ? slots.inject('knj.menu.item', () => {
          try {
            return registerMenuEntry(slots, toggle)
          } catch (error) {
            dispose()
            throw error
          }
        })
        : registerMenuEntry(slots, toggle)

      return dispose
    } catch (error) {
      dispose()
      throw error
    }
  })
}
