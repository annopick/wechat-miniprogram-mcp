export interface ControlApiConfig {
  port: number
  timeout: number
}

let config: ControlApiConfig | null = null

export function initControlApi(userConfig: ControlApiConfig) {
  config = userConfig
}

export async function callControlApi(
  method: string,
  path: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  if (!config) {
    throw new Error('Control API not initialized')
  }

  const url = new URL(path, `http://127.0.0.1:${config.port}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout * 1000)

  try {
    const response = await fetch(url.toString(), {
      method,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }

    return await response.text()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw new Error(`Failed to connect to WeChat DevTools: ${error instanceof Error ? error.message : String(error)}`)
  }
}
