import { describe, it, expect } from 'vitest'
import { autoTools } from './index.js'

describe('Auto Tools', () => {
  it('should export auto tools', () => {
    expect(autoTools).toBeDefined()
    expect(Array.isArray(autoTools)).toBe(true)
    expect(autoTools.length).toBeGreaterThan(0)
  })

  it('should have correct tool names', () => {
    const names = autoTools.map((t) => t.name)
    expect(names).toContain('wechat_auto_connect')
    expect(names).toContain('wechat_auto_navigate')
  })
})
