import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initControlApi, callControlApi } from './control.js'

describe('Control API', () => {
  beforeEach(() => {
    initControlApi({ port: 12345, timeout: 5 })
  })

  it('should make HTTP GET request with query params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    })
    global.fetch = mockFetch

    const result = await callControlApi('GET', '/test', { param1: 'value1' })

    expect(mockFetch).toHaveBeenCalled()
    expect(result).toEqual({ type: 'json', data: { success: true } })
  })

  it('should handle HTTP errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '{"code":19,"message":"Error: project.config.json not found"}',
    })
    global.fetch = mockFetch

    await expect(callControlApi('GET', '/test')).rejects.toThrow(
      'HTTP 500: Internal Server Error - {"code":19,"message":"Error: project.config.json not found"}'
    )
  })

  it('should handle HTTP errors with empty body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => '',
    })
    global.fetch = mockFetch

    await expect(callControlApi('GET', '/test')).rejects.toThrow('HTTP 404: Not Found')
  })

  it('should handle timeout errors', async () => {
    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100)
      })
    })
    global.fetch = mockFetch

    await expect(callControlApi('GET', '/test')).rejects.toThrow('Failed to connect to WeChat DevTools')
  })

  it('should handle binary image response (e.g. /v2/preview)', async () => {
    // Simulate a PNG image response from /v2/preview
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: async () => pngBytes.buffer,
    })
    global.fetch = mockFetch

    const result = await callControlApi('GET', '/v2/preview', { project: '/demo' })

    expect(result).toEqual({
      type: 'binary',
      data: 'iVBORw0KGgo=', // base64 of the PNG header bytes
      mimeType: 'image/png',
    })
  })

  it('should handle application/octet-stream binary response', async () => {
    const binaryData = new Uint8Array([0x01, 0x02, 0x03, 0x04])
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/octet-stream' }),
      arrayBuffer: async () => binaryData.buffer,
    })
    global.fetch = mockFetch

    const result = await callControlApi('GET', '/v2/preview', { project: '/demo' })

    expect(result).toEqual({
      type: 'binary',
      data: 'AQIDBA==',
      mimeType: 'application/octet-stream',
    })
  })

  it('should handle text response for non-JSON endpoints', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'OK',
    })
    global.fetch = mockFetch

    const result = await callControlApi('GET', '/v2/open')

    expect(result).toEqual({ type: 'text', data: 'OK' })
  })

  it('should handle response with no content-type header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: async () => 'some text',
    })
    global.fetch = mockFetch

    const result = await callControlApi('GET', '/v2/quit')

    expect(result).toEqual({ type: 'text', data: 'some text' })
  })
})
