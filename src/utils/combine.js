const fq = require('fuzzquire');
const db = fq('models');
const Sequelize = require('sequelize');
const moment = require('moment');
const fs = require('fs');

// Authoritative file to get combined information on an image from the
// db using its files info. We should merge data from all tables here.

const get_images_info = async (files_info) => {
    const uuid_filter = files_info.map((file) => {
        return file.uuid;
    });
    db.Files.hasMany(db.Images, { foreignKey: 'uuid' });
    db.Images.belongsTo(db.Files, {
        foreignKey: 'uuid',
        targetKey: 'uuid',
    });
    db.TagPairs.belongsTo(db.Images, {
        foreignKey: 'uuid',
        targetKey: 'uuid',
    });
    db.Images.hasMany(db.TagPairs, {
        foreignKey: 'uuid',
        targetKey: 'uuid',
        sourceKey: 'uuid',
        as: 'Tags',
    });
    db.TagPairs.belongsTo(db.Tags, {
        foreignKey: 'tag',
        targetKey: 'id',
    });
    db.Tags.hasMany(db.TagPairs, {
        foreignKey: 'id',
        targetKey: 'tag',
        sourceKey: 'id',
        as: 'TagPairs',
    });
    db.Devices.hasMany(db.Images, {
        sourceKey: 'id',
        targetKey: 'device_id',
    });
    db.Images.belongsTo(db.Devices, {
        sourceKey: 'device_id',
        targetKey: 'id',
        as: 'Device',
    });
    let images;
    try {
        images = await db.Images.findAll({
            where: {
                uuid: {
                    [Sequelize.Op.in]: uuid_filter,
                },
            },
            include: [
                {
                    model: db.Files,
                    attributes: ['path'],
                },
                {
                    model: db.Devices,
                    attributes: ['name', 'id', 'make', 'model', 'serial'],
                    as: 'Device',
                },
                {
                    model: db.TagPairs,
                    attributes: [
                        [
                            Sequelize.fn(
                                'group_concat',
                                Sequelize.col('Tags.tag'),
                                '<separator>'
                            ),
                            'all',
                        ],
                    ],
                    group: [Sequelize.col('uuid')],
                    as: 'Tags',
                },
            ],
            raw: true,
            group: [Sequelize.col('Images.uuid')],
        });
    } catch (e) {
        console.error(e);
        _logger.error(
            'Some SQL plus ORM issue; please report this bug on Github.'
        );
        process.exit(1);
    }
    const all_tags = await db.Tags.findAll();
    return { image_info: images, all_tags };
};

const map_image_info = (image_info, all_tags) => {
    image_info = image_info.map((image) => {
        // Populate tag objects;
        let tags = [];
        if (image['Tags.all']) {
            tags = image['Tags.all'].split('<separator>').map((e) => {
                const id = parseInt(e);
                const found_tag = all_tags.find((e) => e.id == id);
                return found_tag;
            });
        }
        image.tags = tags;
        // clean up some props.
        image.path = image['File.path'];
        delete image['Tags.all'];
        delete image['File.path'];
        // 2020-03-07 11:34:36.000 +00:00
        image.dateTaken = moment(image.dateTaken, 'YYYY-MM-DD hh:mm:ss.SSS ZZ');
        return image;
    });
    return image_info;
};

const add_paths = (info, paths) => {
    info = info.map((e) => {
        // These are maybe mounted paths.
        e.symlink = false;
        fs.lstat(e.path, function (err, stats) {
            e.symlink = stats.isSymbolicLink();
        });
        e.symlinkPath = e.path;
        return e;
    });
    return info;
};

const main = async (files_info, paths) => {
    let { image_info, all_tags } = await get_images_info(files_info);
    image_info = map_image_info(image_info, all_tags);
    image_info = add_paths(image_info, paths);
    return image_info;
};

module.exports = main;
