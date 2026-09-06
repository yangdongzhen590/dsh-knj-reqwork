import { useEffect, useState } from 'react'
import { fetchPages, type PageEntry } from './api.js'

export function ReqworkPanel({ onClose }: { onClose: () => void }) {
  const [pages, setPages] = useState<PageEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState<PageEntry | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void fetchPages(controller.signal).then((result) => {
      if (controller.signal.aborted) return
      if (result.ok) setPages(result.pages ?? [])
      else setError(result.error ?? 'unknown error')
    })
    return () => { controller.abort() }
  }, [])

  return (
    <div className="reqwork-panel">
      <header className="reqwork-panel__header">
        <div>
          <h2>需求工坊</h2>
          <p>页面清单</p>
        </div>
        <button type="button" onClick={onClose}>关闭</button>
      </header>
      {error !== null && <p className="reqwork-panel__error">加载失败：{error}</p>}
      {pages === null && error === null && <p className="reqwork-panel__muted">正在读取 Vue Router…</p>}
      {pages !== null && (
        <ul className="reqwork-panel__list">
          {pages.map((page) => {
            const selected = selectedPage?.path === page.path
            return (
              <li key={page.path}>
                <button
                  type="button"
                  className="reqwork-panel__row"
                  data-selected={selected || undefined}
                  aria-pressed={selected}
                  onClick={() => setSelectedPage(page)}
                >
                  <code>{page.path}</code>{page.name ? ` · ${page.name}` : ''}
                  <span>{page.file}</span>
                </button>
              </li>
            )
          })}
          {pages.length === 0 && <li className="reqwork-panel__muted">未发现页面。</li>}
        </ul>
      )}
      {selectedPage !== null && (
        <section className="reqwork-panel__inspector" aria-label="页面来源">
          <h3>页面来源</h3>
          <dl>
            <div><dt>PageRef</dt><dd><code>{`@page:${selectedPage.path}`}</code></dd></div>
            <div><dt>路由</dt><dd><code>{selectedPage.path}</code></dd></div>
            <div><dt>组件来源</dt><dd><code>{selectedPage.component ?? selectedPage.file}</code></dd></div>
            {selectedPage.layout && <div><dt>布局</dt><dd><code>{selectedPage.layout}</code></dd></div>}
          </dl>
        </section>
      )}
    </div>
  )
}
