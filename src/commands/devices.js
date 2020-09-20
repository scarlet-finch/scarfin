const fq = require('fuzzquire');
const paths = fq('paths');
const exif = fq('exif');
const db = fq('models');
const Sequelize = require('sequelize');
const commandLineArgs = require('command-line-args');

const parse_args = (argv) => {
    let defs = [{ name: 'command', defaultOption: true }];
    try {
        const opts = commandLineArgs(defs, {
            stopAtFirstUnknown: true,
            argv,
        });
        let fatal = false;
        if (!opts.command) {
            _logger.fatal('argument needed');
            fatal = true;
        } else if (!['list', 'rename'].includes(opts.command)) {
            _logger.fatal('unknown command');
            fatal = true;
        } else if (opts.command == 'rename') {
            opts.argv = opts._unknown || [];
            if (opts.argv.length !== 2) {
                _logger.fatal('unknown arguments');
                fatal = true;
            } else {
                opts.device_id = parseInt(opts.argv[0], 10);
                opts.new_name = opts.argv[1];
                if (isNaN(opts.device_id)) {
                    _logger.fatal('unknown arguments');
                    fatal = true;
                }
            }
        }
        if (fatal) {
            _logger.alert('usage: scarfin devices <command>');
            _logger.alert('   ex: scarfin devices list');
            _logger.alert(
                '       scarfin devices rename <device id> <new name>'
            );
            _logger.alert('   ex: scarfin devices rename 1 sams-camera');
            process.exit(1);
        }

        return opts;
    } catch (e) {
        console.log(e);
        process.exit();
    }
};

module.exports = async (opts) => {
    opts = parse_args(opts.argv);
    if (opts.command == 'list') {
        try {
            const devices = await db.Devices.findAll();
            for (device of devices) {
                const e = device.get({
                    plain: true,
                });
                const image_count = await db.Images.count({
                    where: {
                        deviceId: e.id,
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
    } else if (opts.command == 'rename') {
        const id = opts.device_id;
        const new_name = opts.new_name;
        if (id === undefined || !new_name) {
            _logger.fatal(`provide id as integer and name as string.`);
            _logger.fatal(`    $ scarfin devices rename 1 new-name`);
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
