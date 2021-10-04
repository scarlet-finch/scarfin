const fq = require('fuzzquire');
const paths = fq('paths');
const db = fq('models');
const fs = require('fs');
const db_config = fq('config/database');
const env = process.env.NODE_ENV || 'development';
const mounts = fq('mount-maps');

const print_raw_tables = async (db) => {
    const tables = await db.sequelize.getQueryInterface().showAllSchemas();
    _logger.info(`raw tables`);
    for (table of tables) {
        const fields = await db.sequelize
            .getQueryInterface()
            .describeTable(table.name);
        _logger.info(`    - table: ${table.name}`);
        for (key in fields) {
            _logger.info(
                `        - ${key}     - ${JSON.stringify(fields[key])}`
            );
        }
    }
};

module.exports = async (opts) => {
    let num_files = 0;
    let db_size = 0;
    let num_devices = 0;
    let num_tags = 0;
    let num_tag_pairs = 0;
    try {
        num_files = await db.Files.count();
        num_devices = await db.Devices.count();
        num_tags = await db.Tags.count();
        num_tag_pairs = await db.TagPairs.count();
        const stats = fs.statSync(db_config[env].storage);
        //Convert the file size to megabytes
        db_size = stats['size'] / (1024 * 1024);
        await print_raw_tables(db);
    } catch (e) {
        console.log(e);
        _logger.error(e, e);
        process.exit(1);
    }
    _logger.notice(`files tracked:    ${num_files}`);
    _logger.notice(`devices tracked:  ${num_devices}`);
    _logger.notice(`mounting maps:    ${Object.keys(mounts).length}`);
    _logger.notice(`unique tags:      ${num_tags}`);
    _logger.notice(`file:tag pairs:   ${num_tag_pairs}`);
    _logger.notice(`database size:    ${db_size.toFixed(3)} MB`);

    console.log();
    _logger.notice('mounting maps:');
    for (key in mounts) {
        const m = mounts[key];
        let desc = m.description || 'no description';
        if (m.firstparty) {
            desc = `(default) ${desc}`;
        }
        _logger.notice(`    ${m.name} - ${desc}`);
    }
    return {
        num_files,
        db_size,
        num_devices,
        num_tags,
        num_tag_pairs,
    };
};
