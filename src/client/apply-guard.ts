/** Keep a client-plugin failure from taking down the DSH shell. */
export function applyGuard<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch (error) {
    console.warn('[dsh-knj-reqwork] client apply failed:', error)
    return undefined
  }
}
