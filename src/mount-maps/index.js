const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

let maps = {};

const load_maps = (directory, firstparty = false) => {
    if (!fs.existsSync(directory)) {
        _logger.alert(`maps directory does not exist: ${directory}`);
        return;
    }
    fs.readdirSync(directory)
        .filter((file) => {
            return (
                file.indexOf('.') !== 0 &&
                file !== basename &&
                file !== 'template.js' &&
                file.slice(-3) === '.js'
            );
        })
        .forEach((file) => {
            try {
                const m = require(path.join(directory, file));
                if (!m.name || !m.map) {
                    _logger.error(
                        `mount map doesn't define a name/map function`
                    );
                    _logger.error(`could not load mount map: ${file}`);
                } else {
                    m.firstparty = firstparty;
                    maps[m.name] = m;
                }
            } catch (e) {
                _logger.debug(e);
                _logger.error(`could not load mount map: ${file}`);
            }
        });
};

load_maps(__dirname, true);
load_maps(path.join(process.env.HOME, '.scarfin', 'maps'), false);

module.exports = maps;
