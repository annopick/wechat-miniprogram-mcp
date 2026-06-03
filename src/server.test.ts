import { describe, it, expect } from 'vitest'
import { createServer } from './server.js'

describe('MCP Server', () => {
  it('should create server with correct name and version', () => {
    const server = createServer({ controlPort: 12345, controlTimeout: 30, autoTimeout: 60 })
    expect(server).toBeDefined()
  })
})
