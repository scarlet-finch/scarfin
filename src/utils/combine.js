const fq = require('fuzzquire');
const db = fq('models');
const Sequelize = require('sequelize');
const moment = require('moment');

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
            logger: console.log,
        });
    } catch (e) {
        console.error(e);
        _logger.error(
            'Some SQL plus ORM issue; please report this bug on Github.'
        );
        process.exit(1);
    }

    return images;
};

const map_image_info = (info) => {
    info = info.map((e) => {
        if (e['Tags.all'] == null) {
            e.tags = [];
        } else {
            e.tags = e['Tags.all'].split('<separator>');
            delete e['Tags.all'];
        }
        e.device = e['Device.name'];
        e.path = e['File.path'];
        delete e['File.path'];
        // 2020-03-07 11:34:36.000 +00:00
        e.dateTaken = moment(e.dateTaken, 'YYYY-MM-DD hh:mm:ss.SSS ZZ');
        return e;
    });
    return info;
};

const add_paths = (info, paths) => {
    info = info.map((e) => {
        // These are maybe mounted paths.
        const path_data = paths.find((f) => f.real_path === e.path);
        e.symlink = path_data.path !== path_data.real_path;
        e.symlinkPath = path_data.path;
        return e;
    });
    return info;
};

const main = async (files_info, paths) => {
    let info = await get_images_info(files_info);
    info = map_image_info(info);
    info = add_paths(info, paths);
    return info;
};

module.exports = main;
