const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);
const fs = require('fs');
const fq = require('fuzzquire');
const get_path = fq('get_path');

module.exports = async (opts) => {
    let file_okay_count = 0;
    try {
        opts = opts.map((e) => get_path(e));
        const pid = await ep.open();
        for (file of opts) {
            const metadata = await ep.readMetadata(file, ['-File:all']);
            const primary = metadata.data[0].ImageUniqueID;
            const backup = metadata.data[0].DocumentName;
            _logger.debug(
                `${primary} (${
                    primary === backup ? 'backup matches' : backup
                }) - ${file}`
            );
            if (!primary && backup) {
                _logger.fatal(`primary uuid missing for: ${file}`);
                continue;
            }
            if (!backup && primary) {
                _logger.fatal(`backup uuid missing for: ${file}`);
                continue;
            }
            if (!backup && !primary) {
                _logger.fatal(`uuids missing for: ${file}`);
                continue;
            }
            if (primary !== backup) {
                _logger.fatal(
                    `uuid mismatch between primary and backup for: ${file}`
                );
                continue;
            }
            file_okay_count++;
        }
        ep.close();
        const msg = `${file_okay_count}/${opts.length} files are ok`;
        if (file_okay_count === opts.length) {
            _logger.success(msg);
        } else {
            _logger.notice(msg);
        }
    } catch (e) {
        _logger.error(e);
    }
};
