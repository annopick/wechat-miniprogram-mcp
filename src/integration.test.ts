import { describe, it, expect, beforeAll } from 'vitest'
import { initControlApi, callControlApi } from './api/control.js'

describe('Integration Tests', () => {
  const PORT = 60815
  const PROJECT_PATH = '/Users/veater/WeChatProjects/miniprogram-1'

  beforeAll(() => {
    initControlApi({ port: PORT, timeout: 30 })
  })

  it('should check WeChat DevTools status', async () => {
    try {
      const result = await callControlApi('GET', '/v2/islogin')
      expect(result).toBeDefined()
      console.log('Status:', result)
    } catch (error) {
      console.error('Status check failed:', error)
      throw error
    }
  }, 30000)

  it('should open project', async () => {
    try {
      const result = await callControlApi('GET', '/v2/open', { project: PROJECT_PATH })
      expect(result).toBeDefined()
      console.log('Open result:', result)
    } catch (error) {
      console.error('Open failed:', error)
      throw error
    }
  }, 30000)

  it('should preview project', async () => {
    try {
      const result = await callControlApi('GET', '/v2/preview', { project: PROJECT_PATH })
      expect(result).toBeDefined()
      console.log('Preview result:', result)
    } catch (error) {
      console.error('Preview failed:', error)
      throw error
    }
  }, 30000)
})
