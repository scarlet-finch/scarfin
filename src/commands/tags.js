const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');
const Sequelize = require('sequelize');

module.exports = async (opts, flags) => {
    const filepaths = paths(opts);
    const uuids = await exif.get_uuids(filepaths);
    if (flags.add && flags.add.length > 0) {
        const new_tags = flags.add.split(',');
        const uuids = await exif.get_uuids(filepaths);
        for (uuid of uuids) {
            for (tag of new_tags) {
                const [val, created] = await db.TagPairs.findOrCreate({
                    where: {
                        tag,
                        uuid,
                    },
                });
            }
        }
        _logger.notice(
            `added tags: (${new_tags.join(', ')}) to ${uuids.length} files.`
        );
    }

    if (flags.remove && flags.remove.length > 0) {
        tag_pairs_count = 0;
        const old_tags = flags.remove.split(',');
        for (uuid of uuids) {
            for (tag of old_tags) {
                await db.TagPairs.destroy({
                    where: {
                        tag,
                        uuid,
                    },
                });
            }
        }
        _logger.notice(
            `removed tags: (${old_tags.join(', ')}) from ${uuids.length} files.`
        );
    }

    if (flags.list && flags.list.length > 0) {
        const list_tags = flags.list.split(',');
        for (tag of list_tags) {
            const pairs = await db.TagPairs.findAll({ where: { tag } });
            const filtered_uuids = pairs.map((e) => {
                return {
                    uuid: e.uuid,
                };
            });
            const files = await db.Files.findAll({
                where: {
                    [Sequelize.Op.or]: filtered_uuids,
                },
            });

            _logger.notice(`${tag} (${files.length} files)`);
            for (file of files) {
                _logger.notice(`    - ${file.path}`);
            }
        }
    }

    if (flags.all) {
        const pairs = await db.TagPairs.findAll({
            attributes: ['tag', [Sequelize.fn('COUNT', 'tag'), 'count']],
            group: ['tag'],
            order: [[Sequelize.literal('count'), 'DESC']],
            raw: true,
        });
        for (pair of pairs) {
            pair.tag += ' ' + '-'.repeat(50);
            pair.tag = pair.tag.slice(0, 50);
            _logger.notice(`${pair.tag} (${pair.count} files)`);
        }
    }
    process.exit(0);
};
