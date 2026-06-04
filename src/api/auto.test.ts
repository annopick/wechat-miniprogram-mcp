import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock miniprogram-automator before importing the module
vi.mock('miniprogram-automator', () => ({
  default: {
    launch: vi.fn(),
  },
}))

import { initAutoApi, getConnection, connectAuto, disconnectAuto } from './auto.js'

describe('Auto API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    try {
      await disconnectAuto()
    } catch {
      // ignore if not connected
    }
  })

  describe('initAutoApi', () => {
    it('should store config with projectPath and cliPath', () => {
      initAutoApi({ cliPath: '/path/to/cli', projectPath: '/path/to/project' })
      // No error means config stored successfully
    })

    it('should store config with only projectPath', () => {
      initAutoApi({ projectPath: '/path/to/project' })
      // cliPath is optional, automator will use platform default
    })
  })

  describe('connectAuto', () => {
    it('should launch with projectPath and cliPath', async () => {
      const { default: automator } = await import('miniprogram-automator')
      const mockMiniProgram = { close: vi.fn() }
      vi.mocked(automator.launch).mockResolvedValue(mockMiniProgram as any)

      initAutoApi({ cliPath: '/path/to/cli', projectPath: '/path/to/project' })
      const mp = await connectAuto()

      expect(automator.launch).toHaveBeenCalledWith({
        cliPath: '/path/to/cli',
        projectPath: '/path/to/project',
      })
      expect(mp).toBe(mockMiniProgram)
    })

    it('should launch without cliPath (uses platform default)', async () => {
      const { default: automator } = await import('miniprogram-automator')
      const mockMiniProgram = { close: vi.fn() }
      vi.mocked(automator.launch).mockResolvedValue(mockMiniProgram as any)

      initAutoApi({ projectPath: '/path/to/project' })
      const mp = await connectAuto()

      expect(automator.launch).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
      })
      expect(mp).toBe(mockMiniProgram)
    })

    it('should pass ticket from options', async () => {
      const { default: automator } = await import('miniprogram-automator')
      const mockMiniProgram = { close: vi.fn() }
      vi.mocked(automator.launch).mockResolvedValue(mockMiniProgram as any)

      initAutoApi({ projectPath: '/path/to/project' })
      await connectAuto({ ticket: 'my-ticket' })

      expect(automator.launch).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
        ticket: 'my-ticket',
      })
    })

    it('should pass account from options', async () => {
      const { default: automator } = await import('miniprogram-automator')
      const mockMiniProgram = { close: vi.fn() }
      vi.mocked(automator.launch).mockResolvedValue(mockMiniProgram as any)

      initAutoApi({ projectPath: '/path/to/project' })
      await connectAuto({ account: 'openid123' })

      expect(automator.launch).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
        account: 'openid123',
      })
    })

    it('should prefer per-call ticket over config ticket', async () => {
      const { default: automator } = await import('miniprogram-automator')
      const mockMiniProgram = { close: vi.fn() }
      vi.mocked(automator.launch).mockResolvedValue(mockMiniProgram as any)

      initAutoApi({ projectPath: '/path/to/project', ticket: 'config-ticket' })
      await connectAuto({ ticket: 'call-ticket' })

      expect(automator.launch).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
        ticket: 'call-ticket',
      })
    })

    it('should throw if projectPath is not configured', async () => {
      initAutoApi({})
      await expect(connectAuto()).rejects.toThrow('WECHAT_PROJECT_PATH is required')
    })

    it('should return existing connection on repeated calls', async () => {
      const { default: automator } = await import('miniprogram-automator')
      const mockMiniProgram = { close: vi.fn() }
      vi.mocked(automator.launch).mockResolvedValue(mockMiniProgram as any)

      initAutoApi({ projectPath: '/path/to/project' })
      const mp1 = await connectAuto()
      const mp2 = await connectAuto()

      expect(mp1).toBe(mp2)
      expect(automator.launch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getConnection', () => {
    it('should return null when not connected', () => {
      initAutoApi({ projectPath: '/path/to/project' })
      expect(getConnection()).toBeNull()
    })

    it('should return the active connection after connect', async () => {
      const { default: automator } = await import('miniprogram-automator')
      const mockMiniProgram = { close: vi.fn() }
      vi.mocked(automator.launch).mockResolvedValue(mockMiniProgram as any)

      initAutoApi({ projectPath: '/path/to/project' })
      await connectAuto()

      expect(getConnection()).toBe(mockMiniProgram)
    })
  })

  describe('disconnectAuto', () => {
    it('should disconnect and clear the connection', async () => {
      const { default: automator } = await import('miniprogram-automator')
      const mockMiniProgram = { disconnect: vi.fn(), close: vi.fn() }
      vi.mocked(automator.launch).mockResolvedValue(mockMiniProgram as any)

      initAutoApi({ projectPath: '/path/to/project' })
      await connectAuto()
      await disconnectAuto()

      expect(mockMiniProgram.disconnect).toHaveBeenCalled()
      expect(getConnection()).toBeNull()
    })

    it('should be safe to call when not connected', async () => {
      initAutoApi({ projectPath: '/path/to/project' })
      await disconnectAuto()
    })
  })
})
