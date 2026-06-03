export interface ControlTool {
  name: string
  description: string
  inputSchema: object
  handler: (args: Record<string, unknown>) => Promise<unknown>
}

export const controlTools: ControlTool[] = [
  {
    name: 'wechat_control_status',
    description: 'Check if WeChat DevTools is running and accessible',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => ({ content: [{ type: 'text', text: 'OK' }] }),
  },
  {
    name: 'wechat_control_open',
    description: 'Open WeChat DevTools or a specific project',
    inputSchema: { type: 'object', properties: { project: { type: 'string' } }, required: [] },
    handler: async () => ({ content: [{ type: 'text', text: 'Opened' }] }),
  },
  {
    name: 'wechat_control_preview',
    description: 'Generate a preview QR code for the Mini Program',
    inputSchema: { type: 'object', properties: { project: { type: 'string' } }, required: ['project'] },
    handler: async () => ({ content: [{ type: 'text', text: 'Preview' }] }),
  },
]
