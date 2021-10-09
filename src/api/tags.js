const fq = require('fuzzquire');
const db = fq('models');
const Sequelize = require('sequelize');

const add = async (tags, uuids) => {
    for (uuid of uuids) {
        for (tag of tags) {
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
};

const remove = async (tags, uuids) => {
    for (uuid of uuids) {
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
};

const find = async (tag_name) => {
    const tag_object = await db.Tags.findOne({
        where: {
            name: tag_name,
        },
    });
    return tag_object;
};

const find_files = async (tag_name) => {
    const tag_object = await find(tag_name);
    if (!tag_object) {
        _logger.alert(`tag '${tag}' doesn't exist`);
        return [];
    }
    const pairs = await db.TagPairs.findAll({
        where: { tag: tag_object.id },
    });
    const filtered_uuids = pairs.map((e) => {
        return e.uuid;
    });
    return filtered_uuids;
};

const list = async (opts) => {
    opts = Object.assign(
        {
            show_unused: false,
        },
        opts
    );
    let tags;
    db.TagPairs.belongsTo(db.Tags, {
        foreignKey: 'tag',
        targetKey: 'id',
    });
    if (opts.show_unused) {
        tags = await db.Tags.findAll();
    } else {
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
            raw: false,
        });
        tags = pairs.map((e) => e.Tag);
    }
    return tags;
};

module.exports = {
    add,
    remove,
    find,
    find_files,
    list,
};
