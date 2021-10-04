const fq = require('fuzzquire');
const path = require('path');
const exif = fq('exif');
const db = fq('models');
const paths = fq('paths');
const Sequelize = require('sequelize');
const moment = require('moment');
const filelink = require('filelink');
const commandLineArgs = require('command-line-args');
const mounts = fq('mount-maps');
const combine = fq('combine');

const print_help = (exit_code = 0) => {
    const usage = `scarfin mount [--all] --map <mount map name> [--dry] <path/to/mount/target> -- <image files or folders>
        --all : mount all files
        --dry : log without mounting
        --map : mounting map to use. run 'scarfin status' to see detected maps.
    ex: scarfin mount ~/images --all --dry --map calendar`;

    const help = `
    scarfin mount
    =============

    symlink files from your library to some other place for easier viewing.

    scarfin has the concept of 'mounting' files for showing to people. mounts
    are lightweight views into your photo library that allow you to access the
    same set of photos in multiple ways.

    For example, you could filter some photos from a particular trip to only
    show photos that you've tagged as 'sunset' into a new directory and use
    your favorite photo viewer to access them.

    You can mount your entire library in a calendar like folder structure as
    well as sorted into album-folders simultaneously and it won't take up any
    extra space on your disk.

    Once you're done with a mount, just delete the folder and you're golden!

    usage
    =====

    ${usage}

    mounting maps
    =============

    Mounting maps are simple JS files that tell how to map any file from one location
    to another. Two most commonly used maps are 'flat' and 'calendar'. Each
    map declares its name, description and a function that takes in an array
    of files data and returns an array of from-to locations to link.

    See ~/.scarfin/examples for examples of some maps. You can write your own
    maps and put them in ~/.scarfin/maps/<map-name.js>.
    `;

    const mini_help = `usage: ${usage}

    run 'scarfin mount --help' to see complete help.
    `;
    if (exit_code === 0) {
        console.log(help);
    } else {
        console.log(mini_help);
    }
    process.exit(exit_code);
};

const parse_args = (argv) => {
    const defs = [
        { name: 'all', defaultValue: false, type: Boolean },
        { name: 'map', defaultValue: false, type: String, alias: 'm' },
        { name: 'target', defaultOption: true },
        { name: 'dry', defaultValue: false, type: Boolean },
    ];
    try {
        const opts = commandLineArgs(defs, {
            stopAtFirstUnknown: false,
            partial: true,
            argv,
        });
        opts.argv = opts._unknown || [];
        opts.files = [];
        if (!opts.map) {
            _logger.fatal('mount map not specified');
            _logger.fatal(`run 'scarfin status' to see available mount maps`);
            print_help(1);
        } else {
            if (mounts[opts.map] === undefined) {
                _logger.fatal(`could not find map: ${opts.map}`);
                _logger.fatal(
                    `run 'scarfin status' to see available mount maps`
                );
                exit(1);
            }
        }
        if (!opts.target) {
            _logger.fatal('mount target not specified');
            print_help(1);
        }
        if (opts.argv.length) {
            if (opts.argv[0] !== '--') {
                _logger.fatal('unknown arguments');
                print_help(1);
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

const create_links = async (pairs, location) => {
    pairs = pairs.map((e) => {
        e.to = path.join(location, e.to);
        return e;
    });
    for (e of pairs) {
        _logger.debug(`- ${e.to}`);
    }
    for (e of pairs) {
        await filelink(e.from, e.to, {
            force: true,
            mkdirp: true,
            type: 'symlink',
        });
    }
};

module.exports = async (opts, flags) => {
    if (opts.help) {
        print_help();
    }
    opts = parse_args(opts.argv);
    try {
        let target = opts.target;
        let filepaths = paths(opts.files, true);
        const real_paths = filepaths.map((e) => e.real_path);
        if (!path.isAbsolute(target)) {
            target = path.resolve(process.cwd(), target);
        }
        const where_clause = opts.all
            ? {}
            : {
                  files: {
                      [Sequelize.Op.in]: real_paths,
                  },
              };
        const files = await db.Files.findAll({
            where: where_clause,
        });
        if (opts.all) {
            filepaths = files.map((e) => {
                return { path: e.path, real_path: e.path };
            });
        }
        const images = await combine(files, filepaths);
        let pairs = mounts[opts.map].map(images);
        for (e of pairs) {
            const final_path = path.join(target, e.to);
            if (opts.dry) {
                _logger.notice(`- ${final_path}`);
            } else {
                _logger.debug(`- ${final_path}`);
            }
        }
        if (!opts.dry) {
            await create_links(pairs, target);
            _logger.success(`mounted ${pairs.length} files on ${target}`);
        } else {
            _logger.notice(`dry run completed`);
        }
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};
