const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');
const Sequelize = require('sequelize');

const commandLineArgs = require('command-line-args');

const parse_args = (argv) => {
    const defs = [
        { name: 'command', defaultOption: true, defaultValue: false },
        { name: 'paths', defaultValue: false, type: Boolean },
        { name: 'all', defaultValue: false, type: Boolean },
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
            _logger.alert('       scarfin tags list [--all] [--files] <tags>');
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
        const uuids = await exif.get_uuids(filepaths);
        for (uuid of uuids) {
            for (tag of opts.tags) {
                const [tag_object, tag_created] = await db.Tags.findOrCreate({
                    where: {
                        name: tag,
                    },
                    defauls: {
                        type: 'user-defined',
                        description: '',
                    },
                });
                const [val, pair_created] = await db.TagPairs.findOrCreate({
                    where: {
                        tag: tag_object.id,
                        uuid,
                    },
                });
            }
        }
        _logger.notice(
            `added tags: (${opts.tags.join(', ')}) to ${uuids.length} files.`
        );
    }

    if (opts.command === 'remove') {
        tag_pairs_count = 0;
        for (uuid of uuids) {
            for (tag of opts.tags) {
                const tag_object = await db.Tags.findOne({
                    where: {
                        name: tag,
                    },
                });
                if (!tag_object) {
                    _logger.alert(`tag '${tag}' doesn't exist`);
                    continue;
                }
                const entry = await db.TagPairs.findOne({
                    where: {
                        tag: tag_object.id,
                        uuid,
                    },
                });
                if (!entry) {
                    // entry doesn't exist;
                    _logger.debug(`entry doesn't exist`);
                } else {
                    await entry.destroy();
                }
            }
        }
        _logger.notice(
            `ensured ${
                uuids.length
            } files don't have the tags: (${opts.tags.join(', ')})`
        );
    }

    if (opts.command === 'list') {
        let tags = opts.tags;
        let pairs;
        db.TagPairs.belongsTo(db.Tags, {
            foreignKey: 'tag',
            targetKey: 'id',
        });
        if (opts.all) {
            pairs = await db.TagPairs.findAll({
                attributes: ['tag', [Sequelize.fn('COUNT', 'tag'), 'count']],
                group: ['tag'],
                include: [
                    {
                        model: db.Tags,
                        attributes: ['name', 'description', 'type'],
                        as: 'Tag',
                    },
                ],
                order: [[Sequelize.literal('count'), 'DESC']],
                raw: true,
            });
            tags = pairs.map((e) => e['Tag.name']);
        }
        if (!tags) {
            _logger.alert('no tags to list');
            process.exit();
        }
        for (tag of tags) {
            const tag_object = await db.Tags.findOne({
                where: {
                    name: tag,
                },
            });
            if (!tag_object) {
                _logger.alert(`tag '${tag}' doesn't exist`);
                continue;
            }
            const pairs = await db.TagPairs.findAll({
                where: { tag: tag_object.id },
            });
            const filtered_uuids = pairs.map((e) => {
                return e.uuid;
            });
            const files = await db.Files.findAll({
                where: {
                    uuid: {
                        [Sequelize.Op.in]: filtered_uuids,
                    },
                },
            });
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
