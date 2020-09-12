const path = require('path');

const db_location = path.join(process.env.HOME, '.pixel');

module.exports = {
    development: {
        dialect: 'sqlite',
        storage: path.join(db_location, 'dev.sqlite3'),
    },
    test: {
        dialect: 'sqlite',
        storage: ':memory',
    },
    production: {
        dialect: 'sqlite',
        storage: path.join(db_location, 'primary.sqlite3'),
    },
};