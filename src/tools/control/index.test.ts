import { describe, it, expect } from 'vitest'
import { controlTools } from './index.js'

describe('Control Tools', () => {
  it('should export control tools', () => {
    expect(controlTools).toBeDefined()
    expect(Array.isArray(controlTools)).toBe(true)
    expect(controlTools.length).toBeGreaterThan(0)
  })

  it('should have correct tool names', () => {
    const names = controlTools.map((t) => t.name)
    expect(names).toContain('wechat_control_status')
    expect(names).toContain('wechat_control_open')
    expect(names).toContain('wechat_control_preview')
  })
})
