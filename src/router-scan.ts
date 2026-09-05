import { existsSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

export interface PageEntry {
  path: string
  name?: string
  file: string
  component?: string
  layout?: string
}

const ROUTER_CANDIDATES = [
  'src/router/index.js',
  'src/router/index.ts',
  'src/router.js',
  'src/router.ts',
]

interface RouteBlock {
  start: number
  end: number
  path: string
  name?: string
  componentPath: string
  hasChildren: boolean
}

/** Find the closing brace while ignoring braces in JavaScript strings and comments. */
function findClosingBrace(source: string, start: number): number {
  let depth = 0
  let quote = ''
  let lineComment = false
  let blockComment = false

  for (let index = start; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (char === '\\') {
        index += 1
      } else if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '/' && next === '/') {
      lineComment = true
      index += 1
      continue
    }
    if (char === '/' && next === '*') {
      blockComment = true
      index += 1
      continue
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }

  return -1
}

/** Reads a property only when its key appears at the route object's own depth. */
function directProperty(block: string, property: string): string | undefined {
  let depth = 0
  let quote = ''
  let lineComment = false
  let blockComment = false
  const propertyPattern = new RegExp(`^${property}\\s*:\\s*(['\"])([^'\"]*)\\1`)

  for (let index = 0; index < block.length; index += 1) {
    const char = block[index]
    const next = block[index + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (char === '\\') index += 1
      else if (char === quote) quote = ''
      continue
    }
    if (char === '/' && next === '/') {
      lineComment = true
      index += 1
      continue
    }
    if (char === '/' && next === '*') {
      blockComment = true
      index += 1
      continue
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === '{' || char === '[' || char === '(') {
      depth += 1
      continue
    }
    if (char === '}' || char === ']' || char === ')') {
      depth -= 1
      continue
    }
    if (depth === 0 && (index === 0 || !/[A-Za-z0-9_$]/.test(block[index - 1]))) {
      const match = block.slice(index).match(propertyPattern)
      if (match) return match[2]
    }
  }

  return undefined
}

function directComponentPath(block: string): string | undefined {
  let depth = 0
  let quote = ''
  let lineComment = false
  let blockComment = false
  const componentPattern = /^component\s*:\s*[\s\S]*?\bimport\s*\(\s*(?:\/\*[\s\S]*?\*\/\s*)?(['\"])([^'\"]+\.vue)\1/

  for (let index = 0; index < block.length; index += 1) {
    const char = block[index]
    const next = block[index + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (char === '\\') index += 1
      else if (char === quote) quote = ''
      continue
    }
    if (char === '/' && next === '/') {
      lineComment = true
      index += 1
      continue
    }
    if (char === '/' && next === '*') {
      blockComment = true
      index += 1
      continue
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === '{' || char === '[' || char === '(') {
      depth += 1
      continue
    }
    if (char === '}' || char === ']' || char === ')') {
      depth -= 1
      continue
    }
    if (depth === 0 && (index === 0 || !/[A-Za-z0-9_$]/.test(block[index - 1]))) {
      const match = block.slice(index).match(componentPattern)
      if (match) return match[2]
    }
  }

  return undefined
}

function scanRouteBlocks(source: string): RouteBlock[] {
  const routes: RouteBlock[] = []

  for (let start = 0; start < source.length; start += 1) {
    if (source[start] !== '{') continue
    const end = findClosingBrace(source, start)
    if (end === -1) continue

    const block = source.slice(start + 1, end)
    const path = directProperty(block, 'path')
    const componentPath = directComponentPath(block)
    if (!path || !componentPath) continue

    routes.push({
      start,
      end,
      path,
      name: directProperty(block, 'name'),
      componentPath,
      hasChildren: /(?:^|[^A-Za-z0-9_$])children\s*:/.test(block),
    })
  }

  return routes
}

export function scanVueRouter(projectRoot: string): PageEntry[] {
  const routerFile = ROUTER_CANDIDATES
    .map((candidate) => resolve(projectRoot, candidate))
    .find((candidate) => existsSync(candidate))
  if (!routerFile) throw new Error(`vue-router file not found under ${projectRoot}`)

  const routes = scanRouteBlocks(readFileSync(routerFile, 'utf8'))
  return routes.map((route) => {
    const parent = routes
      .filter((candidate) => candidate.hasChildren && candidate.start < route.start && candidate.end > route.end)
      .sort((left, right) => right.start - left.start)[0]

    return {
      path: route.path,
      ...(route.name ? { name: route.name } : {}),
      file: resolve(routerFile, '..', route.componentPath),
      component: basename(route.componentPath),
      ...(parent?.path === '/home' ? { layout: 'home-child' } : {}),
    }
  })
}
