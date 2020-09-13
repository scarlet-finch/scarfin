const fq = require('fuzzquire');
const path = require('path');
const exif = fq('exif');
const db = fq('models');
const Sequelize = require('sequelize');
const moment = require('moment');
const filelink = require('filelink');

const make_date_folders = (files) => {
    const paths = [];
    for (file of files) {
        const date = moment(file.date_taken);
        paths.push({
            from: file.File.path,
            to: `${date.year()}/${date.format(
                'MMMM'
            )}/${date.date()}-${date.format('dddd')}/${file.uuid}.jpg`,
        });
    }
    return paths;
};

const create_links = async (pairs) => {
    for (e of pairs) {
        await filelink(e.from, e.to, {
            force: true,
            mkdirp: true,
            type: 'symlink',
        });
    }
};

module.exports = async (opts, flags) => {
    if (flags.root && flags.root.length > 0) {
        let location = flags.root;
        if (!path.isAbsolute(location)) {
            location = path.resolve(process.cwd(), location);
        }
        _logger.notice(`mounting on ${location}`);
        db.Files.hasMany(db.Images, { foreignKey: 'uuid' });
        db.Images.belongsTo(db.Files, {
            foreignKey: 'uuid',
            targetKey: 'uuid',
        });
        const files = await db.Images.findAll({
            include: [db.Files],
        });
        let pairs = make_date_folders(files);
        pairs = pairs.map((e) => {
            e.to = path.join(location, e.to);
            return e;
        });
        for (e of pairs) {
            _logger.debug(`- ${e.to}`);
        }
        await create_links(pairs);
    } else {
        _logger.alert('specify mount directory');
        _logger.alert('--root /path/to/folder');
    }
};
