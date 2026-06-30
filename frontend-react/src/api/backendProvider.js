import { API_BASE_URLS } from './client'

export const BACKEND_PROVIDERS = {
  ruby: {
    id: 'ruby',
    label: 'Ruby API',
    shortLabel: 'Ruby',
  },
  csharp: {
    id: 'csharp',
    label: 'C# API',
    shortLabel: 'C#',
  },
}

const STORAGE_KEY = 'examflow_active_backend'
const DEFAULT_PROVIDER = 'ruby'
const listeners = new Set()

let activeBackend = normalizeProvider(localStorage.getItem(STORAGE_KEY))
let lastFailover = null

function normalizeProvider(provider) {
  return BACKEND_PROVIDERS[provider] ? provider : DEFAULT_PROVIDER
}

export function getActiveBackend() {
  return activeBackend
}

export function getFallbackBackend(provider = activeBackend) {
  return provider === 'ruby' ? 'csharp' : 'ruby'
}

export function getLastFailover() {
  return lastFailover
}

export function setActiveBackend(provider, meta = {}) {
  const nextProvider = normalizeProvider(provider)
  activeBackend = nextProvider
  localStorage.setItem(STORAGE_KEY, nextProvider)

  if (meta.reason === 'auto') {
    lastFailover = {
      from: meta.from,
      to: nextProvider,
      at: new Date().toISOString(),
      message: meta.message || 'Active backend changed automatically.',
    }
  }

  listeners.forEach((listener) => listener({
    activeBackend,
    lastFailover,
    reason: meta.reason || 'manual',
  }))
}

export function subscribeBackend(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function checkBackendHealth(provider, timeoutMs = 2500) {
  const normalizedProvider = normalizeProvider(provider)
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URLS[normalizedProvider]}/health`, {
      signal: controller.signal,
    })
    const data = await response.json().catch(() => null)

    return {
      provider: normalizedProvider,
      ok: response.ok,
      status: response.status,
      data,
      checkedAt: new Date().toISOString(),
    }
  } catch (error) {
    return {
      provider: normalizedProvider,
      ok: false,
      status: 0,
      error: error.name === 'AbortError' ? 'Request timed out' : error.message,
      checkedAt: new Date().toISOString(),
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function checkAllBackendHealth() {
  const results = await Promise.all(
    Object.keys(BACKEND_PROVIDERS).map((provider) => checkBackendHealth(provider)),
  )

  return results.reduce((acc, result) => {
    acc[result.provider] = result
    return acc
  }, {})
}

export function shouldFailover(error) {
  return error instanceof TypeError || error?.status === 0 || error?.status >= 500
}
