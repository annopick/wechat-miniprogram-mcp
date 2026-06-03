export interface ControlApiConfig {
  port: number
  timeout: number
  projectPath?: string
}

export type ControlApiResponse =
  | { type: 'text'; data: string }
  | { type: 'json'; data: unknown }
  | { type: 'binary'; data: string; mimeType: string }

let config: ControlApiConfig | null = null

export function initControlApi(userConfig: ControlApiConfig) {
  config = userConfig
}

export function getDefaultProject(): string | undefined {
  return config?.projectPath
}

function isBinaryContentType(contentType: string): boolean {
  return (
    contentType.startsWith('image/') ||
    contentType === 'application/octet-stream'
  )
}

export async function callControlApi(
  method: string,
  path: string,
  params?: Record<string, unknown>
): Promise<ControlApiResponse> {
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
      const errorBody = await response.text().catch(() => '')
      throw new Error(`HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`)
    }

    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      return { type: 'json', data: await response.json() }
    }

    if (isBinaryContentType(contentType)) {
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return { type: 'binary', data: base64, mimeType: contentType.split(';')[0].trim() }
    }

    return { type: 'text', data: await response.text() }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw new Error(`Failed to connect to WeChat DevTools: ${error instanceof Error ? error.message : String(error)}`)
  }
}
