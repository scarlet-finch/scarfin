'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const fq = require('fuzzquire');
const db = fq('models');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = fq('config/database')[env];
const Umzug = require('umzug');

const db_location = path.join(process.env.HOME, '.scarfin');

const sequelize = db.sequelize;
const umzug = new Umzug({
    storage: 'sequelize',

    storageOptions: {
        sequelize: sequelize,
    },

    migrations: {
        params: [sequelize.getQueryInterface(), Sequelize],
        path: path.join(__dirname, '../migrations'),
    },
});

const migrate_db = async () => {
    try {
        if (!fs.existsSync(config.storage)) {
            _logger.alert(
                `database missing. creating new at: ${config.storage}`
            );
        }
        const pending = await umzug.pending();
        if (pending.length > 0) {
            _logger.alert(
                `applying ${pending.length} pending database migrations`
            );
            // remove examples so we can update them. this ensures examples
            // modified between updates are synced with the ones in user's directory.
            fs.rmdirSync(path.join(process.env.HOME, '.scarfin', 'examples'), { recursive: true });
            await umzug.up();
            _logger.success(`database migrated`);
        }
    } catch (err) {
        console.error(err);
        _logger.fatal('database migration failed');
        process.exit(1);
    }
};

const copy_examples = async () => {
    const location = path.join(process.env.HOME, '.scarfin', 'examples');
    try {
        if (fs.existsSync(location)) {
            return;
        }
        _logger.alert(`copying examples to: ${location}`);
        fs.mkdirSync(location);
        fs.mkdirSync(path.join(location, 'maps'));

        const maps_dir = path.join(__dirname, '..', 'mount-maps');
        fs.readdirSync(maps_dir)
            .filter((file) => {
                return (
                    file.indexOf('.') !== 0 &&
                    file !== 'index.js' &&
                    file.slice(-3) === '.js'
                );
            })
            .forEach((file) => {
                fs.copyFileSync(
                    path.join(maps_dir, file),
                    path.join(location, 'maps', file)
                );
            });
        fs.mkdirSync(path.join(process.env.HOME, '.scarfin', 'maps'), {
            recursive: true,
        });
    } catch (err) {
        console.error(err);
        _logger.fatal('examples copying failed');
    }
};

module.exports = async () => {
    await migrate_db();
    await copy_examples();
};
