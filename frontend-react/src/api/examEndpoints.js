import { csharpEndpoints } from './csharpEndpoints'
import { getActiveBackend, getFallbackBackend, setActiveBackend, shouldFailover } from './backendProvider'
import { rubyEndpoints } from './rubyEndpoints'

const endpointProviders = {
  ruby: rubyEndpoints,
  csharp: csharpEndpoints,
}

const retrySafeActions = new Set([
  'health',
  'login',
  'getMonThi',
  'getSinhVien',
  'getPhong',
  'getKyThis',
  'getKyThi',
  'getDangKy',
  'getPhanPhong',
  'getXepCho',
  'getDiemDanh',
  'getNguoiDung',
  'getNguoiDungById',
  'getVaiTro',
  'getNhatKy',
  'getNhatKyById',
])

async function callWithFailover(action, args) {
  const primaryProvider = getActiveBackend()
  const fallbackProvider = getFallbackBackend(primaryProvider)

  try {
    return await endpointProviders[primaryProvider][action](...args)
  } catch (error) {
    if (!shouldFailover(error)) {
      throw error
    }

    if (!retrySafeActions.has(action)) {
      error.message = `${error.message} Write failover was blocked for ${action} to avoid duplicated SQL changes. Retry after the active backend switches.`
      throw error
    }

    try {
      const result = await endpointProviders[fallbackProvider][action](...args)
      setActiveBackend(fallbackProvider, {
        reason: 'auto',
        from: primaryProvider,
        message: `${endpointProviders[primaryProvider] ? primaryProvider : 'Primary'} API failed during ${action}.`,
      })
      return result
    } catch (fallbackError) {
      fallbackError.message = `Both backend providers failed. ${fallbackError.message}`
      throw fallbackError
    }
  }
}

export const examEndpoints = Object.keys(rubyEndpoints).reduce((acc, action) => {
  acc[action] = (...args) => callWithFailover(action, args)
  return acc
}, {})
