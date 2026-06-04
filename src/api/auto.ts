import automator from 'miniprogram-automator'
import { logger } from '../logger.js'

export interface AutoApiConfig {
  cliPath?: string
  projectPath?: string
  ticket?: string
  account?: string
  timeout?: number
}

let config: AutoApiConfig = {}
let connection: any = null

export function initAutoApi(cfg: AutoApiConfig): void {
  config = { ...cfg }
  connection = null
  logger.debug(`Auto API initialized: cliPath=${config.cliPath || '(platform default)'}, projectPath=${config.projectPath || '(not set)'}`)
}

export function getConnection(): any {
  return connection
}

export interface ConnectOptions {
  ticket?: string
  account?: string
}

export async function connectAuto(options?: ConnectOptions): Promise<any> {
  if (connection) {
    return connection
  }

  const projectPath = config.projectPath
  if (!projectPath) {
    throw new Error(
      'Cannot launch: WECHAT_PROJECT_PATH is required for automator. Set it as an environment variable.'
    )
  }

  const launchOptions: any = {
    projectPath,
  }

  if (config.cliPath) {
    launchOptions.cliPath = config.cliPath
  }

  if (config.timeout) {
    launchOptions.timeout = config.timeout
  }

  // ticket: prefer per-call option, then config-level
  const ticket = options?.ticket || config.ticket
  if (ticket) {
    launchOptions.ticket = ticket
  }

  // account: prefer per-call option, then config-level
  const account = options?.account || config.account
  if (account) {
    launchOptions.account = account
  }

  logger.info(`Launching DevTools automator for project: ${projectPath}`)
  connection = await automator.launch(launchOptions)

  return connection
}

export async function disconnectAuto(): Promise<void> {
  if (!connection) {
    return
  }
  try {
    connection.disconnect()
  } catch {
    // ignore disconnect errors
  }
  connection = null
  logger.info('Disconnected from DevTools automator')
}

export async function closeAuto(): Promise<void> {
  if (!connection) {
    return
  }
  try {
    await connection.close()
  } catch {
    // ignore close errors
  }
  connection = null
  logger.info('Closed DevTools automator connection and project')
}
