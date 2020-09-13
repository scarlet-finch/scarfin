const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);
const fs = require('fs');
const fq = require('fuzzquire');
const path = fq('paths');
const db = fq('models');

module.exports = async (opts) => {
    let file_okay_count = 0;
    try {
        const tables = await db.sequelize.getQueryInterface().showAllSchemas();
        console.log(tables);
        _logger.debug(`raw tables`);
        for (table of tables) {
            const fields = await db.sequelize
                .getQueryInterface()
                .describeTable(table.name);
            _logger.debug(`    - table: ${table.name}`);
            for (key in fields) {
                _logger.debug(
                    `        - ${key} - ${JSON.stringify(fields[key])}`
                );
            }
        }
    } catch (e) {
        console.log(e);
        _logger.error(e);
    }
};
