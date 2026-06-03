import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { logger } from './logger.js'
import { controlTools } from './tools/control/index.js'
import { autoTools } from './tools/auto/index.js'

export interface ServerConfig {
  controlPort: number
  controlTimeout: number
  autoTimeout: number
}

export function createServer(config: ServerConfig) {
  const server = new Server(
    {
      name: 'wechat-miniprogram-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  const allTools = [
    ...controlTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
    ...autoTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  ]

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug(`Listing ${allTools.length} tools`)
    return { tools: allTools }
  })

  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params
    logger.debug(`Calling tool: ${name}`)

    const controlTool = controlTools.find((t) => t.name === name)
    if (controlTool) {
      return await controlTool.handler((args as Record<string, unknown>) || {})
    }

    const autoTool = autoTools.find((t) => t.name === name)
    if (autoTool) {
      return await autoTool.handler((args as Record<string, unknown>) || {})
    }

    throw new Error(`Unknown tool: ${name}`)
  })

  return server
}

export async function startServer(config: ServerConfig) {
  const server = createServer(config)
  const transport = new StdioServerTransport()
  logger.info('Starting WeChat MiniProgram MCP Server')
  await server.connect(transport)
}
