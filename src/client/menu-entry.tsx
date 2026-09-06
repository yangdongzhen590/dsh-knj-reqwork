import { useEffect, useState, type ReactElement } from 'react'

export const MENU_SLOT = 'knj.menu.item'
const MENU_ENTRY_ID = 'reqwork'

export interface MenuEntryRegisterOptions {
  name: typeof MENU_SLOT
  id: string
  order: number
  locale: string
}

export interface SlotsLike {
  register?(options: MenuEntryRegisterOptions, component: () => ReactElement): () => void
  inject?(key: string, callback: () => (() => void) | Iterable<() => void>): () => void
}

const ENTRY_CSS = `
.reqwork-menu-entry{display:flex;align-items:center;gap:6px;box-sizing:border-box;width:100%;height:36px;padding:0 10px 0 8px;border:0;border-radius:8px;color:var(--dsw-alias-label-secondary);background:transparent;font:inherit;font-size:13px;line-height:20px;cursor:pointer;text-align:left}
.reqwork-menu-entry:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.reqwork-menu-entry[data-active]{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary);font-weight:600}
`

let styleElement: HTMLStyleElement | undefined
function ensureStyle(): void {
  if (styleElement !== undefined || typeof document === 'undefined') return
  styleElement = document.createElement('style')
  styleElement.setAttribute('data-dsh-reqwork-style', 'menu')
  styleElement.textContent = ENTRY_CSS
  document.head.appendChild(styleElement)
}

export function clearMenuStyle(): void {
  styleElement?.remove()
  styleElement = undefined
}

function ReqworkEntry({ onToggle }: { onToggle: () => void }) {
  const [active, setActive] = useState(false)
  useEffect(() => { ensureStyle() }, [])
  return <button type="button" className="reqwork-menu-entry" data-active={active || undefined} onClick={() => { setActive((value) => !value); onToggle() }}>需求工坊</button>
}

export function registerMenuEntry(slots: SlotsLike | null | undefined, onToggle: () => void): () => void {
  if (typeof slots?.register !== 'function') return () => {}
  return slots.register(
    { name: MENU_SLOT, id: MENU_ENTRY_ID, order: -10, locale: 'zh' },
    () => <ReqworkEntry onToggle={onToggle} />,
  )
}
