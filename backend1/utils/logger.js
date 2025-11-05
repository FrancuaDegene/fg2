const levels = {
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
};

const env = process.env.NODE_ENV || 'development';
const isDebugEnabled = env !== 'production';

function formatPrefix(prefix) {
  return prefix ? `[${prefix}]` : '';
}

function log(level, prefix, ...args) {
  if (level === levels.debug && !isDebugEnabled) {
    return;
  }

  const method = console[level] ? console[level] : console.log;
  method(formatPrefix(prefix), ...args);
}

module.exports = {
  info(prefix, ...args) {
    log(levels.info, prefix, ...args);
  },
  warn(prefix, ...args) {
    log(levels.warn, prefix, ...args);
  },
  error(prefix, ...args) {
    log(levels.error, prefix, ...args);
  },
  debug(prefix, ...args) {
    log(levels.debug, prefix, ...args);
  },
};
