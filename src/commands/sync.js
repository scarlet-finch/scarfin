const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');
const Sequelize = require('sequelize');

const write_or_update_files_db = async (uuid, path) => {
    const db_file = await db.Files.findOne({ where: { uuid } });
    if (db_file === null) {
        await db.Files.create({
            path,
            uuid,
        });
        return 'write';
    }
    if (db_file.path !== path) {
        await db_file.update({
            path,
        });
        return 'update';
    }
};

const write_multiple_files = async (metadata_list) => {
    let db_add_count = 0;
    let db_update_count = 0;
    try {
        for (e of metadata_list) {
            _logger.debug(`uuid-list ${e.uuid} - ${e.path}`);
            const result = await write_or_update_files_db(e.uuid, e.path);
            if (result === 'write') {
                db_add_count++;
            } else if (result === 'update') {
                db_update_count++;
            }
        }
    } catch (e) {
        console.error(e);
        _logger.error(e);
        process.exit(1);
    }
    return { db_add_count, db_update_count };
};

const copy_metadata = async (uuid, metadata) => {
    console.log(metadata);
};

const write_devices = async (metadata_list) => {
    let device_add_count = 0;
    try {
        for (e of metadata_list) {
            const make = e.metadata.data[0].Make;
            const model = e.metadata.data[0].Model;
            const serial = e.metadata.data[0].SerialNumber
                ? e.metadata.data[0].SerialNumber.toString()
                : null;
            const name = `${make} ${model} (${serial})`.toLowerCase();
            const device = await db.Devices.findOne({
                where: {
                    make,
                    model,
                    serial,
                },
            });
            if (device === null) {
                await db.Devices.create({
                    name,
                    make,
                    model,
                    serial,
                });
                device_add_count++;
            }
        }
    } catch (e) {
        console.error(e);
        _logger.error('error syncing device info');
        process.exit();
    }
    return device_add_count;
};

const maybe_write_image_rows = async (metadata_list) => {
    try {
        for (e of metadata_list) {
            const make = e.metadata.data[0].Make;
            const model = e.metadata.data[0].Model;
            const serial = e.metadata.data[0].SerialNumber
                ? e.metadata.data[0].SerialNumber.toString()
                : null;
            const device = await db.Devices.findOne({
                where: {
                    make,
                    model,
                    serial,
                },
            });
            if (device === null) {
                _logger.fatal(`cannot find device for: ${e.path}`);
                _logger.fatal(`this is a programming error`);
                process.exit(1);
            }
            await db.Images.findOrCreate({
                where: {
                    uuid: e.uuid,
                },
                defaults: {
                    device_id: device.id,
                },
            });
        }
    } catch (e) {
        console.error(e);
        _logger.error('error syncing device info');
        process.exit();
    }
};

const handle_files = async (filepaths, flags) => {
    // We have to do the following:

    // 1. Ensure files have a UUID.
    const { metadata_list, write_count } = await exif.read_write_uuid_info(
        filepaths
    );

    // 2. Ensure files are in files table.

    const { db_add_count, db_update_count } = await write_multiple_files(
        metadata_list
    );

    // 3. Ensure files' devices are registered in database.
    const device_add_count = await write_devices(metadata_list);

    // 4. Ensure files have a row in images table.
    await maybe_write_image_rows(metadata_list);

    // 5. Log final stats.
    _logger.success(`synced ${metadata_list.length}/${filepaths.length} files`);
    _logger.notice(`written ${write_count} new files`);
    _logger.notice(`created ${db_add_count} new db rows`);
    _logger.notice(`updated ${db_update_count} db rows`);
    _logger.notice(`added ${device_add_count} new devices`);
};

module.exports = async (filepaths, flags) => {
    filepaths = paths(filepaths);
    handle_files(filepaths, flags);
};
