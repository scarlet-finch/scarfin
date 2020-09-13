const path = require('path');
const location = path.join(process.env.HOME, '.pixel', 'config.js');

let config = {
    default_utc_offset: '+00:00',
};

try {
    const mod = require(location);
    const is_object = typeof mod === 'object' && mod !== null;
    if (!is_object) {
        // config must be an object, at least.
        _logger.fatal(`error parsing config: ${location}`);
        _logger.fatal(`please ensure config file exports an object`);
        process.exit(1);
    }
    config = Object.assign(config, mod);
    _logger.debug(`loaded config: ${location}`);
    _logger.debug(JSON.stringify(mod));
    _logger.debug(JSON.stringify(config));
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        // user didn't write a config; let it be.
    }
    if (e instanceof SyntaxError) {
        // user wrote a config but there are errors; complain!
        console.error(e);
        _logger.fatal(`error parsing config: ${location}`);
        _logger.fatal(`please check your config file for syntax errors`);
        process.exit(1);
    }
}

module.exports = config;
