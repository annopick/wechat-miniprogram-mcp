import { describe, it, expect, vi, beforeEach } from 'vitest'
import { controlTools } from './index.js'
import { initControlApi } from '../../api/control.js'

describe('Control Tools', () => {
  beforeEach(() => {
    initControlApi({ port: 12345, timeout: 5 })
  })

  it('should use default project path when project arg is not provided', async () => {
    initControlApi({ port: 12345, timeout: 5, projectPath: '/default/project' })
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'OK',
    })
    global.fetch = mockFetch

    const previewTool = controlTools.find((t) => t.name === 'wechat_control_preview')!
    await previewTool.handler({})

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('project=%2Fdefault%2Fproject')
  })

  it('should prefer explicit project arg over default path', async () => {
    initControlApi({ port: 12345, timeout: 5, projectPath: '/default/project' })
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'OK',
    })
    global.fetch = mockFetch

    const openTool = controlTools.find((t) => t.name === 'wechat_control_open')!
    await openTool.handler({ project: '/explicit/project' })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('project=%2Fexplicit%2Fproject')
    expect(calledUrl).not.toContain('default')
  })

  it('should throw error when project is required but neither arg nor default provided', async () => {
    initControlApi({ port: 12345, timeout: 5 })
    const mockFetch = vi.fn()
    global.fetch = mockFetch

    const previewTool = controlTools.find((t) => t.name === 'wechat_control_preview')!
    await expect(previewTool.handler({})).rejects.toThrow(
      'project path is required. Provide it as an argument or set WECHAT_PROJECT_PATH env var.'
    )
  })

  it('should export control tools', () => {
    expect(controlTools).toBeDefined()
    expect(Array.isArray(controlTools)).toBe(true)
    expect(controlTools.length).toBeGreaterThan(0)
  })

  it('should have correct tool names', () => {
    const names = controlTools.map((t) => t.name)
    expect(names).toContain('wechat_control_login')
    expect(names).toContain('wechat_control_preview')
    expect(names).toContain('wechat_control_upload')
    expect(names).toContain('wechat_control_open')
    expect(names).toContain('wechat_control_close')
    expect(names).toContain('wechat_control_quit')
    expect(names).toContain('wechat_control_buildnpm')
    expect(names).toContain('wechat_control_autopreview')
    expect(names).toContain('wechat_control_cleancache')
    expect(names).toContain('wechat_control_resetfileutils')
    expect(names).toContain('wechat_control_islogin')
  })

  it('should have required fields for each tool', () => {
    for (const tool of controlTools) {
      expect(tool.name).toBeDefined()
      expect(tool.description).toBeDefined()
      expect(tool.inputSchema).toBeDefined()
      expect(tool.handler).toBeDefined()
      expect(typeof tool.handler).toBe('function')
    }
  })

  it('should handle preview tool with binary response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'iVBORw0KGgoAAAANSUhEUg==', // base64 QR code
    })
    global.fetch = mockFetch

    const previewTool = controlTools.find((t) => t.name === 'wechat_control_preview')!
    const result = await previewTool.handler({ project: '/demo' })

    expect(result).toEqual({
      content: [{
        type: 'image',
        data: 'iVBORw0KGgoAAAANSUhEUg==',
        mimeType: 'image/png',
      }],
    })
  })

  it('should handle login tool with base64 default', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'base64qrcodedata',
    })
    global.fetch = mockFetch

    const loginTool = controlTools.find((t) => t.name === 'wechat_control_login')!
    const result = await loginTool.handler({})

    // Should default to base64 format and convert to image
    expect(result).toEqual({
      content: [{
        type: 'image',
        data: 'base64qrcodedata',
        mimeType: 'image/png',
      }],
    })

    // Verify qr-format=base64 was sent
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('qr-format=base64')
  })

  it('should handle non-QR tools with text response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'OK',
    })
    global.fetch = mockFetch

    const openTool = controlTools.find((t) => t.name === 'wechat_control_open')!
    const result = await openTool.handler({})

    expect(result).toEqual({
      content: [{ type: 'text', text: 'OK' }],
    })
  })

  it('should handle tools with JSON response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ logged: true }),
    })
    global.fetch = mockFetch

    const isloginTool = controlTools.find((t) => t.name === 'wechat_control_islogin')!
    const result = await isloginTool.handler({})

    expect(result).toEqual({
      content: [{ type: 'text', text: '{\n  "logged": true\n}' }],
    })
  })

  it('should handle raw binary image response from preview', async () => {
    // When user explicitly requests qr-format=image, the API returns binary PNG
    initControlApi({ port: 12345, timeout: 5 })
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: async () => pngBytes.buffer,
    })
    global.fetch = mockFetch

    const previewTool = controlTools.find((t) => t.name === 'wechat_control_preview')!
    const result = await previewTool.handler({ project: '/demo', 'qr-format': 'image' })

    expect(result).toEqual({
      content: [{
        type: 'image',
        data: 'iVBORw==',
        mimeType: 'image/png',
      }],
    })
  })
})
