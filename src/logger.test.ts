import { describe, it, expect, vi } from 'vitest'
import { logger } from './logger.js'

describe('Logger', () => {
  it('should log messages', () => {
    const mockWrite = vi.fn()
    const originalStderr = process.stderr.write
    process.stderr.write = mockWrite as any

    logger.info('test message')

    expect(mockWrite).toHaveBeenCalled()
    const loggedMessage = mockWrite.mock.calls[0][0]
    expect(loggedMessage).toContain('INFO')
    expect(loggedMessage).toContain('test message')

    process.stderr.write = originalStderr
  })
})
