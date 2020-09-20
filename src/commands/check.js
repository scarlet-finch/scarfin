const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const commandLineArgs = require('command-line-args');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);
const fs = require('fs');
const fq = require('fuzzquire');
const path = fq('paths');
const db = fq('models');

const parse_args = (argv) => {
    const defs = [{ name: 'all', defaultValue: false, type: Boolean }];
    try {
        const opts = commandLineArgs(defs, {
            stopAtFirstUnknown: false,
            partial: true,
            argv,
        });
        opts.argv = opts._unknown || [];
        opts.files = [];
        if (opts.argv.length) {
            if (opts.argv[0] !== '--') {
                _logger.fatal('unknown arguments');
                _logger.alert(
                    'usage: scarfin check [--all] -- <image files or folders>'
                );
                _logger.alert(
                    '   ex: scarfin check -- ~/Pictures ~/Downloads/wallpaper.jpg'
                );
                _logger.alert('   ex: scarfin check --all');
                process.exit(1);
            } else {
                opts.files = opts.argv.slice(1);
            }
        }
        return opts;
    } catch (e) {
        console.log(e);
        process.exit();
    }
};

module.exports = async (opts) => {
    opts = parse_args(opts.argv);
    try {
        const files = path(opts.files);
        let file_okay_count = 0;
        const pid = await ep.open();
        for (file of files) {
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
        const msg = `${file_okay_count}/${files.length} files are ok`;
        if (file_okay_count === files.length && files.length > 0) {
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
