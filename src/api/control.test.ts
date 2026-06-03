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
    expect(result).toEqual({ success: true })
  })

  it('should handle HTTP errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })
    global.fetch = mockFetch

    await expect(callControlApi('GET', '/test')).rejects.toThrow('HTTP 500: Internal Server Error')
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
})
