import { stderr } from 'node:process'

const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO'

const LEVELS: Record<string, number> = {
  DEBUG: 0,
  INFO: 1,
  ERROR: 2,
}

function log(level: string, message: string) {
  if (LEVELS[LOG_LEVEL] === undefined || LEVELS[level] < LEVELS[LOG_LEVEL]) {
    return
  }
  const timestamp = new Date().toISOString()
  stderr.write(`[${timestamp}] [${level}] ${message}\n`)
}

export const logger = {
  debug: (msg: string) => log('DEBUG', msg),
  info: (msg: string) => log('INFO', msg),
  error: (msg: string) => log('ERROR', msg),
}
