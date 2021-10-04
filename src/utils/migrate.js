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
            try {
                fs.rmdirSync(
                    path.join(process.env.HOME, '.scarfin', 'examples'),
                    {
                        recursive: true,
                    }
                );
            } catch (e) {
                // directory non existent; ignore.
            }
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
    const root = path.join(process.env.HOME, '.scarfin');
    const examples_dir = path.join(root, 'examples');
    try {
        if (fs.existsSync(examples_dir)) {
            return;
        }
        _logger.alert(`copying examples to: ${examples_dir}`);
        fs.mkdirSync(examples_dir);
        fs.mkdirSync(path.join(examples_dir, 'maps'));

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
                    path.join(examples_dir, 'maps', file)
                );
            });
        const config_path = path.join(
            __dirname,
            '..',
            '..',
            'config',
            'default.js'
        );
        fs.copyFileSync(
            config_path,
            path.join(examples_dir, 'default_config.js')
        );
        if (!fs.existsSync(path.join(root, 'config.js'))) {
            fs.copyFileSync(config_path, path.join(root, 'config.js'));
        }

        fs.mkdirSync(path.join(root, 'maps'), {
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
