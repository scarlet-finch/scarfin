const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');
const Sequelize = require('sequelize');
const api = fq('api');

const commandLineArgs = require('command-line-args');

const parse_args = (argv) => {
    const defs = [
        { name: 'command', defaultOption: true, defaultValue: false },
        { name: 'paths', defaultValue: false, type: Boolean },
        { name: 'all', defaultValue: false, type: Boolean },
        { name: 'show-unused', defaultValue: false, type: Boolean },
    ];
    try {
        const opts = commandLineArgs(defs, {
            stopAtFirstUnknown: false,
            partial: true,
            argv,
        });
        let fatal = false;
        opts.argv = opts._unknown || [];
        opts.files = [];
        if (!['add', 'remove', 'list'].includes(opts.command)) {
            _logger.fatal('unknown command');
            fatal = true;
        }
        expect_files = ['add', 'remove'].includes(opts.command);
        expect_tags = ['list'].includes(opts.command);
        if (expect_files && opts.argv.length == 0) {
            _logger.fatal('tags and files not specified');
            fatal = true;
        } else if (expect_tags && opts.argv.length) {
            opts.tags = opts.argv;
        } else if (!expect_files && opts.argv.length) {
            _logger.fatal('unknown arguments');
            fatal = true;
        } else if (opts.argv.length) {
            const hyphens = opts.argv.indexOf('--');
            if ([-1, 0, opts.argv.length - 1].includes(hyphens)) {
                _logger.fatal('unknown arguments');
                fatal = true;
            } else {
                opts.tags = opts.argv.slice(0, hyphens);
                opts.files = opts.argv.slice(hyphens + 1);
            }
        }
        if (fatal) {
            _logger.alert(
                'usage: scarfin tags [add/remove] <tags> -- <images/folders>'
            );
            _logger.alert(
                '       scarfin tags list [--all] [--show-unused] [--files] <tags>'
            );
            _logger.alert(
                '   ex: scarfin tags add wallpapers sunset -- ~/Pictures/wallpapers ~/Downloads/wallpaper.jpg'
            );
            _logger.alert(
                '   ex: scarfin tags remove sunset -- ~/Pictures/wallpapers ~/Downloads/wallpaper.jpg'
            );
            _logger.alert('   ex: scarfin tags list --paths wallpapers');
            _logger.alert('   ex: scarfin tags list --all');
            process.exit(1);
        }
        return opts;
    } catch (e) {
        console.log(e);
        process.exit();
    }
};

module.exports = async (opts, flags) => {
    opts = parse_args(opts.argv);
    const filepaths = paths(opts.files);
    let uuids;
    try {
        uuids = await exif.get_uuids(filepaths);
    } catch (e) {
        console.log('ERROR', e);
    }
    if (opts.command === 'add') {
        await api.tags.add(opts.tags, uuids);
        _logger.notice(
            `added tags: (${opts.tags.join(', ')}) to ${uuids.length} files.`
        );
    }

    if (opts.command === 'remove') {
        tag_pairs_count = 0;
        await api.tags.remove(opts.tags, uuids);
        _logger.notice(
            `ensured ${
                uuids.length
            } files don't have the tags: (${opts.tags.join(', ')})`
        );
    }

    if (opts.command === 'list') {
        let tags = opts.tags;
        let pairs;
        if (opts.all) {
            tags = await api.tags.list({
                show_unused: opts['show-unused'],
            });
            tags = tags.map((e) => e.name);
        }
        if (!tags) {
            _logger.alert('no tags to list');
            process.exit();
        }
        for (tag of tags) {
            const uuids = await api.tags.find_files(tag);
            const files = await db.Files.findAll({
                where: {
                    uuid: {
                        [Sequelize.Op.in]: uuids,
                    },
                },
            });
            const tag_object = await api.tags.find(tag);
            const description_text = tag_object.description
                ? `(${tag_object.description}) `
                : '';
            _logger.notice(
                `${tag_object.name} ${description_text}- ${files.length} files`
            );
            if (opts.paths) {
                for (file of files) {
                    _logger.notice(`    - ${file.path}`);
                }
            }
        }
    }
    process.exit(0);
};
