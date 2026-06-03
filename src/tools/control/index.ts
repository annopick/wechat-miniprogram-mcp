import { callControlApi, getDefaultProject, type ControlApiResponse } from '../../api/control.js'

export interface ControlTool {
  name: string
  description: string
  inputSchema: object
  handler: (args: Record<string, unknown>) => Promise<unknown>
}

function formatMcpContent(response: ControlApiResponse) {
  switch (response.type) {
    case 'text':
      return { content: [{ type: 'text' as const, text: response.data }] }
    case 'json':
      return { content: [{ type: 'text' as const, text: JSON.stringify(response.data, null, 2) }] }
    case 'binary':
      return { content: [{ type: 'image' as const, data: response.data, mimeType: response.mimeType }] }
  }
}

const PROJECT_DESC = 'Path to the Mini Program project. Falls back to WECHAT_PROJECT_PATH env var if not provided.'

function resolveProject(args: Record<string, unknown>): Record<string, unknown> {
  const params = { ...args }
  if (!params.project) {
    const defaultProject = getDefaultProject()
    if (defaultProject) {
      params.project = defaultProject
    }
  }
  return params
}

function requireProject(params: Record<string, unknown>): void {
  if (!params.project) {
    throw new Error('project path is required. Provide it as an argument or set WECHAT_PROJECT_PATH env var.')
  }
}

export const controlTools: ControlTool[] = [
  {
    name: 'wechat_control_login',
    description: 'Login to WeChat DevTools, returns a QR code for scanning',
    inputSchema: {
      type: 'object',
      properties: {
        'qr-format': {
          type: 'string',
          enum: ['image', 'base64', 'terminal'],
          description: 'QR code format: image (PNG), base64, or terminal text. Defaults to base64 for MCP compatibility.',
        },
        'qr-output': {
          type: 'string',
          description: 'File path to write QR code data to',
        },
        'result-output': {
          type: 'string',
          description: 'File path to write login result JSON',
        },
      },
      required: [],
    },
    handler: async (args) => {
      const params: Record<string, unknown> = { ...args }
      if (!params['qr-format']) {
        params['qr-format'] = 'base64'
      }
      const response = await callControlApi('GET', '/v2/login', params)

      if (response.type === 'text' && params['qr-format'] === 'base64') {
        return {
          content: [{
            type: 'image' as const,
            data: response.data,
            mimeType: 'image/png',
          }],
        }
      }

      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_islogin',
    description: 'Check if WeChat DevTools is logged in',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const response = await callControlApi('GET', '/v2/islogin')
      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_preview',
    description: 'Generate a preview QR code for the Mini Program project',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: PROJECT_DESC,
        },
        'qr-format': {
          type: 'string',
          enum: ['image', 'base64', 'terminal'],
          description: 'QR code format: image (PNG), base64, or terminal text. Defaults to base64 for MCP compatibility.',
        },
        'qr-output': {
          type: 'string',
          description: 'File path to write QR code data to',
        },
        'info-output': {
          type: 'string',
          description: 'File path to write preview info JSON (code package size, subpackage info)',
        },
        'compile-condition': {
          type: 'string',
          description: 'Custom compile condition as JSON string, e.g. {"pathName":"pages/index/index","query":"a=1"}',
        },
      },
      required: [],
    },
    handler: async (args) => {
      const params = resolveProject(args)
      requireProject(params)
      if (!params['qr-format']) {
        params['qr-format'] = 'base64'
      }
      const response = await callControlApi('GET', '/v2/preview', params)

      if (response.type === 'text' && params['qr-format'] === 'base64') {
        return {
          content: [{
            type: 'image' as const,
            data: response.data,
            mimeType: 'image/png',
          }],
        }
      }

      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_upload',
    description: 'Upload the Mini Program project code with a version number',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: PROJECT_DESC,
        },
        version: {
          type: 'string',
          description: 'Version number for this upload, e.g. v1.0.0',
        },
        desc: {
          type: 'string',
          description: 'Description/notes for this upload',
        },
        'info-output': {
          type: 'string',
          description: 'File path to write upload info JSON (code package size, subpackage info)',
        },
      },
      required: ['version'],
    },
    handler: async (args) => {
      const params = resolveProject(args)
      requireProject(params)
      const response = await callControlApi('GET', '/v2/upload', params)
      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_autopreview',
    description: 'Auto-preview the Mini Program on a connected device',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: PROJECT_DESC,
        },
        'info-output': {
          type: 'string',
          description: 'File path to write preview info JSON',
        },
      },
      required: [],
    },
    handler: async (args) => {
      const params = resolveProject(args)
      requireProject(params)
      const response = await callControlApi('GET', '/v2/autopreview', params)
      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_buildnpm',
    description: 'Build npm packages for the Mini Program project',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: PROJECT_DESC,
        },
        'compile-type': {
          type: 'string',
          enum: ['miniprogram', 'plugin'],
          description: 'Compile type: miniprogram (default) or plugin',
        },
      },
      required: [],
    },
    handler: async (args) => {
      const params = resolveProject(args)
      requireProject(params)
      const response = await callControlApi('GET', '/v2/buildnpm', params)
      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_open',
    description: 'Open WeChat DevTools or a specific project',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: PROJECT_DESC,
        },
      },
      required: [],
    },
    handler: async (args) => {
      const params = resolveProject(args)
      const response = await callControlApi('GET', '/v2/open', params)
      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_close',
    description: 'Close a project window in WeChat DevTools',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: PROJECT_DESC,
        },
      },
      required: [],
    },
    handler: async (args) => {
      const params = resolveProject(args)
      requireProject(params)
      const response = await callControlApi('GET', '/v2/close', params)
      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_quit',
    description: 'Quit WeChat DevTools',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const response = await callControlApi('GET', '/v2/quit')
      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_resetfileutils',
    description: 'Reset file watchers and rebuild file monitoring for the project',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: PROJECT_DESC,
        },
      },
      required: [],
    },
    handler: async (args) => {
      const params = resolveProject(args)
      requireProject(params)
      const response = await callControlApi('GET', '/v2/resetfileutils', params)
      return formatMcpContent(response)
    },
  },
  {
    name: 'wechat_control_cleancache',
    description: 'Clear cache for the Mini Program project',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: PROJECT_DESC,
        },
        clean: {
          type: 'string',
          enum: ['storage', 'file', 'session', 'auth', 'network', 'compile', 'all'],
          description: 'Cache type to clear: storage, file, session, auth, network, compile, or all',
        },
      },
      required: ['clean'],
    },
    handler: async (args) => {
      const params = resolveProject(args)
      requireProject(params)
      const response = await callControlApi('GET', '/v2/cleancache', params)
      return formatMcpContent(response)
    },
  },
]
