const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');

module.exports = async (opts) => {
    opts = paths(opts);
    let db_add_count = 0;
    let db_update_count = 0;
    const { uuid_list, write_count } = await exif(opts);
    try {
        for (e of uuid_list) {
            _logger.debug(`uuid-list ${e.uuid} - ${e.path}`);
            const db_file = await db.Files.findOne({ where: { uuid: e.uuid } });
            if (db_file === null) {
                await db.Files.create({
                    path: e.path,
                    uuid: e.uuid,
                });
                db_add_count++;
                continue;
            }
            if (db_file.path !== e.path) {
                await db_file.update({
                    path: e.path,
                });
                db_update_count++;
                continue;
            }
        }
    } catch (e) {
        console.log(e);
        _logger.error(e);
        process.exit(1);
    }
    _logger.success(`synced ${uuid_list.length}/${opts.length} files`);
    _logger.notice(`written ${write_count} new files`);
    _logger.notice(`created ${db_add_count} new db rows`);
    _logger.notice(`updated ${db_update_count} db rows`);
};
