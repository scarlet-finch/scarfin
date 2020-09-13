const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');

const write_or_update_files_db = async (uuid, path) => {
    const db_file = await db.Files.findOne({ where: { uuid } });
    if (db_file === null) {
        await db.Files.create({
            path,
            uuid,
        });
        return 'write';
    }
    if (db_file.path !== path) {
        await db_file.update({
            path,
        });
        return 'update';
    }
};

const copy_metadata = async (uuid, metadata) => {
    console.log(metadata);
};

module.exports = async (opts, flags) => {
    opts = paths(opts);
    if (flags.metadata) {
        console.log('Asked to copy metadata');
    }
    let db_add_count = 0;
    let db_update_count = 0;
    const { metadata_list, write_count } = await exif(opts);
    try {
        for (e of metadata_list) {
            _logger.debug(`uuid-list ${e.uuid} - ${e.path}`);
            const result = await write_or_update_files_db(e.uuid, e.path);
            if (result === 'write') {
                db_add_count++;
            } else if (result === 'update') {
                db_update_count++;
            }
            if (flags.metadata) {
                copy_metadata(e.uuid, e.metadata);
            }
        }
    } catch (e) {
        console.log(e);
        _logger.error(e);
        process.exit(1);
    }
    _logger.success(`synced ${metadata_list.length}/${opts.length} files`);
    _logger.notice(`written ${write_count} new files`);
    _logger.notice(`created ${db_add_count} new db rows`);
    _logger.notice(`updated ${db_update_count} db rows`);
};
