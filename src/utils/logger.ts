/**
import logger from 'bragi-browser'

if (process.env.NODE_ENV !== 'development') {
  logger.transports.empty()
}

logger.transports.get('console').property('showMeta', false)
logger.transports.get('console').property('showColors', false)
*/

export default console
