export interface AutoTool {
  name: string
  description: string
  inputSchema: object
  handler: (args: Record<string, unknown>) => Promise<unknown>
}

export const autoTools: AutoTool[] = [
  {
    name: 'wechat_auto_connect',
    description: 'Connect to WeChat DevTools automator',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => ({ content: [{ type: 'text', text: 'Connected' }] }),
  },
  {
    name: 'wechat_auto_navigate',
    description: 'Navigate to a specific page in the Mini Program',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    handler: async () => ({ content: [{ type: 'text', text: 'Navigated' }] }),
  },
]
