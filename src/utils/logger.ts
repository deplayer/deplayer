import logger from 'bragi-browser'

logger.transports.get('console').property('showMeta', false)
logger.transports.get('console').property('showColors', false)

export default logger
