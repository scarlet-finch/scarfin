const fq = require('fuzzquire');
const path = require('path');
const exif = fq('exif');
const db = fq('models');
const paths = fq('paths');
const Sequelize = require('sequelize');
const moment = require('moment');
const filelink = require('filelink');
const commandLineArgs = require('command-line-args');

const parse_args = (argv) => {
    const defs = [
        { name: 'all', defaultValue: false, type: Boolean },
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
        if (opts.argv.length) {
            if (opts.argv[0] !== '--') {
                _logger.fatal('unknown arguments');
                _logger.alert(
                    'usage: pixel mount [--all] [--dry] <path/to/mount/target> -- <image files or folders>'
                );
                _logger.alert('       --all : mount all files');
                _logger.alert('       --dry : log without mounting');
                _logger.alert('   ex: pixel mount ~/images --all --dry');
                process.exit(1);
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

const make_date_folders = (files) => {
    const paths = [];
    for (file of files) {
        const date = moment(file.date_taken);
        paths.push({
            from: file.File.path,
            to: `${date.year()}/${date.format('MMMM')}/${date.format(
                'DD'
            )}-${date.format('dddd')}/${path.basename(file.File.path)}`,
        });
    }
    return paths;
};

const make_single_folder = (files) => {
    const paths = [];
    for (file of files) {
        const date = moment(file.date_taken);
        paths.push({
            from: file.File.path,
            to: `flat/${date.toISOString()}.jpg`,
        });
    }
    return paths;
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
    opts = parse_args(opts.argv);
    try {
        let target = opts.target;
        const filepaths = paths(opts.files);
        if (!path.isAbsolute(target)) {
            target = path.resolve(process.cwd(), target);
        }
        _logger.notice(`mounting on ${target}`);
        db.Files.hasMany(db.Images, { foreignKey: 'uuid' });
        db.Images.belongsTo(db.Files, {
            foreignKey: 'uuid',
            targetKey: 'uuid',
        });
        const selected_files = filepaths.map((e) => {
            return { '$File.path$': e };
        });
        const where_clause = opts.all
            ? {}
            : { [Sequelize.Op.or]: selected_files };
        const files = await db.Images.findAll({
            where: where_clause,
            include: [db.Files],
        });
        let pairs = make_date_folders(files);
        pairs = pairs.concat(make_single_folder(files));
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
        }
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};
