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

module.exports = async () => {
    try {
        if (!fs.existsSync(config.storage)) {
            _logger.alert(`database missing. creating new at: ${config.storage}`);
        }
        const pending = await umzug.pending();
        if (pending.length > 0) {
            _logger.alert(`applying ${pending.length} pending database migrations`);
            await umzug.up();
            _logger.success(`database migrated`)
        }
        
    } catch (err) {
        console.error(err);
        _logger.fatal('database migration failed');
    }
};
