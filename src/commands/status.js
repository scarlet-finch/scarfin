const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');
const fs = require('fs');
const db_config = fq('config/database');
const env = process.env.NODE_ENV || 'development';

module.exports = async (opts) => {
    let num_files = 0;
    let db_size = 0;
    try {
        num_files = await db.Files.count();
    } catch (e) {
        console.log(e);
        _logger.error(e);
        process.exit(1);
    }
    _logger.notice(`${num_files} files known to pixel`);
};
