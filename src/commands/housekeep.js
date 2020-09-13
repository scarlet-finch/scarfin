const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');
const Sequelize = require('sequelize');
const moment = require('moment');

// These are development commands; we should find better ways to handle
// these eventually. We need to run these operations at time of first
// copy, ideally.

const copy_date_taken = async () => {
    const exifs = await db.Exifs.findAll({
        raw: true,
    });
    for (e of exifs) {
        const data = JSON.parse(e.data);
        const image = await db.Images.findOne({
            where: {
                uuid: e.uuid,
            },
        });
        const timezone = data.OffsetTime || _config.default_utc_offset;
        const datestring = data.DateTimeOriginal + ' ' + timezone;
        const date = moment(datestring, 'YYYY:MM:DD HH:mm:ss ZZ');
        await image.update({
            date_taken: date.toDate(),
        });
    }
    _logger.notice(`updated ${exifs.length} files`);
};

module.exports = async (opts, flags) => {
    try {
        if (flags.dateTaken) {
            await copy_date_taken();
        }
    } catch (e) {
        console.error(e);
        _logger.fatal('database error');
        process.exit(1);
    }
};