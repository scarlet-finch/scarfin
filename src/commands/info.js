const commandLineArgs = require('command-line-args');
const fq = require('fuzzquire');
const path = fq('paths');
const exif = fq('exif');
const db = fq('models');
const combine = fq('combine');
const Sequelize = require('sequelize');

const print_help = (exit_code = 0) => {
    const usage = `scarfin info -- <image files or folders>
    ex: scarfin info -- ~/Downloads/wallpaper.jpg`;

    const help = `
    scarfin info
    =============

    see information scarfin knows/operates on for a file/files.

    Scarfin does not keep track of all EXIF data, and doesn't only keep track
    of EXIF data. This command shows you what Scarfin knows and can possibly
    know about an image.

    usage
    =====

    ${usage}

    read_paths: false
    =============

    By default, Scarfin tries to read files from the paths given and then
    retrieve the fingerprint that is used to follow that file around. If
    read_paths is set to false, we simply use the path as the primary key
    in the database and read from that.

    This avoids the additional filesystem call and spinning up an exiftool
    server to read the data. In some cases, this can be useful if you store
    your images on an external drive that might be unmounted when trying
    to read/modify a file's metadata.

    WARNING: If you move files around, you would need to run 'scarfin sync'
    manually to get the internal database in sync with the reality. If you're
    not sure what you're doing, keep read_paths set to true.
    `;

    const mini_help = `usage: ${usage}

    run 'scarfin info --help' to see complete help.
    `;
    if (exit_code === 0) {
        console.log(help);
    } else {
        console.log(mini_help);
    }
    process.exit(exit_code);
};

const parse_args = (argv) => {
    const defs = [];
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
                print_help(1);
            } else {
                opts.files = opts.argv.slice(1);
            }
        } else {
            _logger.fatal('no files specified');
            print_help(1);
        }
        return opts;
    } catch (e) {
        console.log(e);
        process.exit();
    }
};

const get_file_info = async (paths) => {
    let files = [];
    if (_config.read_paths) {
        const uuids = await exif.get_uuids(paths, false);
        files = await db.Files.findAll({
            where: {
                [Sequelize.Op.or]: uuids.map((uuid) => {
                    return { uuid };
                }),
            },
            raw: true,
        });
    } else {
        files = await db.Files.findAll({
            where: {
                [Sequelize.Op.or]: paths.map((path) => {
                    return { path };
                }),
            },
            raw: true,
        });
    }
    return files;
};

const report_missing = async (files, paths) => {
    if (files.length == paths.length) {
        return;
    }
    let filepaths = files.map((e) => e.path);
    for (e of paths) {
        if (!filepaths.includes(e.real_path)) {
            _logger.alert(`file not in db: ${e.path}. skipping`);
        }
    }
    return;
};

const print_image = (image) => {
    const text = `
    ${image.path}
        - uuid:           ${image.uuid}
        - name:           ${image.name}
        - album:          ${image.album}
        - device:         ${image.device} (${image.deviceId})
        - tags            ${image.tags.join(', ')}
        - date            ${image.dateTaken.format('llll')}
        - symlink         ${image.symlink ? image.symlinkPath : false}`;
    console.log(text);
    // TODO figure out how to use _logger instead of console.log.
};

module.exports = async (opts) => {
    if (opts.help) {
        print_help();
    }
    opts = parse_args(opts.argv);
    try {
        const paths = path(opts.files, true);
        const real_paths = paths.map((e) => e.real_path);
        const files = await get_file_info(real_paths);
        report_missing(files, paths);
        const images = await combine(files, paths);
        for (image of images) {
            print_image(image);
        }
    } catch (e) {
        console.error(e);
        _logger.error(e);
        process.exit(1);
    }
};
