const path = require('path');

const db_location = path.join(process.env.HOME, '.scarfin');

module.exports = {
    development: {
        dialect: 'sqlite',
        storage: path.join(db_location, 'dev.sqlite3'),
    },
    test: {
        dialect: 'sqlite',
        storage: 'test-database',
    },
    production: {
        dialect: 'sqlite',
        storage: path.join(db_location, 'primary.sqlite3'),
    },
};
