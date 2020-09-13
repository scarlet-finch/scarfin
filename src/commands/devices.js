const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');
const Sequelize = require('sequelize');

module.exports = async (opts, flags) => {
    if (opts[0] == 'list') {
        try {
            const devices = await db.Devices.findAll();
            for (device of devices) {
                const e = device.get({
                    plain: true,
                });
                const image_count = await db.Images.count({
                    where: {
                        device_id: e.id,
                    },
                });
                _logger.notice(
                    `device ${e.id} - ${e.name} - ${image_count} images`
                );
                _logger.debug(
                    `id: ${e.id} name : ${e.name} make: ${e.make} model: ${e.model} serial: ${e.serial}`
                );
            }
        } catch (e) {
            console.error(e);
            _logger.error(`database error`);
            process.exit(1);
        }
    } else if (opts[0] == 'rename') {
        const id = parseInt(opts[1], 10);
        const new_name = opts[2];
        if (id === undefined || !new_name) {
            _logger.fatal(`provide id as integer and name as string.`);
            _logger.fatal(`    $ pixel devices rename 1 new-name`);
            process.exit(1);
        }
        try {
            const device = await db.Devices.findOne({
                where: {
                    id,
                },
            });
            const old_name = device.name;
            device.name = new_name;
            await device.save();
            _logger.success(`renamed device ${id} (${old_name} > ${new_name})`);
        } catch (e) {
            console.error(e);
            _logger.error(`database error`);
            process.exit(1);
        }
    }
};
