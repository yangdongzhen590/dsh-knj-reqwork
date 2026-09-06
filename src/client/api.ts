export interface PageEntry {
  path: string
  name?: string
  file: string
  component?: string
  layout?: string
}

export interface PagesResponse {
  ok: boolean
  root?: string
  pages?: PageEntry[]
  error?: string
}

const PAGES_ENDPOINT = '/dsh-knj-reqwork/pages'

export async function fetchPages(signal?: AbortSignal): Promise<PagesResponse> {
  try {
    const response = await fetch(PAGES_ENDPOINT, { signal })
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` }
    return await response.json() as PagesResponse
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
