const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);
const fs = require('fs');
const fq = require('fuzzquire');
const path = fq('paths');
const db = fq('models');

module.exports = async (opts, flags) => {
    let file_okay_count = 0;
    try {
        opts = path(opts);
        const pid = await ep.open();
        for (file of opts) {
            const metadata = await ep.readMetadata(file, ['c "%.6f"']);
            const primary = metadata.data[0].ImageUniqueID;
            const backup = metadata.data[0].DocumentName;
            const backup_status = primary === backup;
            let db_file = null;
            if (primary) {
                db_file = await db.Files.findOne({
                    where: { uuid: primary.replace('uuid:', '') },
                });
            }
            const db_status = db_file !== null;
            const file_status = db_status ? db_file.path === file : false;

            const statuses = `${backup_status} ${db_status} ${file_status}`;
            _logger.debug(`${primary} (${statuses}) - ${file}`);
            if (flags.metadata) {
                _logger.notice(`metadata for ${file}`);
                console.log(metadata.data[0]);
            }
            if (!primary && backup) {
                _logger.fatal(`primary uuid missing for: ${file}`);
                continue;
            }
            if (!backup && primary) {
                _logger.fatal(`backup uuid missing for: ${file}`);
                continue;
            }
            if (!backup && !primary) {
                _logger.alert(`unsynced file: ${file}`);
                continue;
            }
            if (primary !== backup) {
                _logger.fatal(
                    `uuid mismatch between primary and backup for: ${file}`
                );
                continue;
            }
            if (!db_status) {
                _logger.fatal(`database row missing for: ${file}`);
                continue;
            }
            if (!file_status) {
                _logger.alert(`file moved from original location: ${file}`);
                _logger.alert(
                    `                     database has: ${db_file.path}`
                );
                continue;
            }
            file_okay_count++;
        }
        ep.close();
        const msg = `${file_okay_count}/${opts.length} files are ok`;
        if (file_okay_count === opts.length && opts.length > 0) {
            _logger.success(msg);
        } else {
            _logger.notice(msg);
        }
    } catch (e) {
        console.error(e);
        _logger.error(e);
        process.exit(1);
    }
};
