import { startServer } from './server.js'
import { initControlApi } from './api/control.js'
import { logger } from './logger.js'

const CONTROL_PORT = parseInt(process.env.WECHAT_DEVTOOLS_PORT || '', 10)
const CONTROL_TIMEOUT = 30
const AUTO_TIMEOUT = 60

if (isNaN(CONTROL_PORT)) {
  logger.error('Environment variable WECHAT_DEVTOOLS_PORT is required')
  process.exit(1)
}

initControlApi({ port: CONTROL_PORT, timeout: CONTROL_TIMEOUT })

startServer({
  controlPort: CONTROL_PORT,
  controlTimeout: CONTROL_TIMEOUT,
  autoTimeout: AUTO_TIMEOUT,
}).catch((error) => {
  logger.error(`Server error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})

export { startServer }
