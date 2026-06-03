import { describe, it, expect } from 'vitest'

describe('Index', () => {
  it('should export startServer', async () => {
    process.env.WECHAT_DEVTOOLS_PORT = '12345'
    const { startServer } = await import('./index.js')
    expect(startServer).toBeDefined()
    expect(typeof startServer).toBe('function')
  })
})
