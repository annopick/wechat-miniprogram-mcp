import { startServer } from './server.js'
import { initControlApi } from './api/control.js'
import { initAutoApi } from './api/auto.js'
import { logger } from './logger.js'

const CONTROL_PORT = parseInt(process.env.WECHAT_DEVTOOLS_PORT || '', 10)
const CONTROL_TIMEOUT = 30
const AUTO_TIMEOUT = 60
const PROJECT_PATH = process.env.WECHAT_PROJECT_PATH || ''
const CLI_PATH = process.env.WECHAT_DEVTOOLS_CLI_PATH || ''

if (isNaN(CONTROL_PORT) && !CLI_PATH) {
  logger.error('Either WECHAT_DEVTOOLS_PORT or WECHAT_DEVTOOLS_CLI_PATH must be set')
  process.exit(1)
}

if (PROJECT_PATH) {
  logger.info(`Default project path: ${PROJECT_PATH}`)
} else {
  logger.info('No default project path set (WECHAT_PROJECT_PATH not provided)')
}

if (!isNaN(CONTROL_PORT)) {
  initControlApi({ port: CONTROL_PORT, timeout: CONTROL_TIMEOUT, projectPath: PROJECT_PATH || undefined })
}

initAutoApi({
  cliPath: CLI_PATH || undefined,
  projectPath: PROJECT_PATH || undefined,
})

startServer({
  controlPort: CONTROL_PORT,
  controlTimeout: CONTROL_TIMEOUT,
  autoTimeout: AUTO_TIMEOUT,
}).catch((error) => {
  logger.error(`Server error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})

export { startServer }
