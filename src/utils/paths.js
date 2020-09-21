const path = require('path');
const glob = require('glob');
const fs = require('fs');

const valid_extensions = ['jpg', 'jpeg', 'JPG', 'JPEG'];

const get_with_symlinks = (locations) => {
    const files = [];
    for (location of locations) {
        if (!path.isAbsolute(location)) {
            location = path.resolve(process.cwd(), location);
        }
        if (fs.lstatSync(location).isDirectory()) {
            let all_files = glob.sync(
                path.join(location, `/**/*.{${valid_extensions.join(',')}}`)
            );
            for (f of all_files) {
                const real_path = fs.realpathSync(f);
                files.push({
                    path: f,
                    real_path: real_path,
                });
                if (f !== real_path) {
                    _logger.debug(`found file: ${f} -> ${real_path}`);
                } else {
                    _logger.debug(`found file: ${f}`);
                }
            }
        } else {
            const ext = path.extname(location).replace('.', '');
            if (!valid_extensions.includes(ext)) {
                _logger.alert(`rejecting non jpg file: ${location}`);
                continue;
            }
            const real_path = fs.realpathSync(location);
            files.push({
                path: location,
                real_path: real_path,
            });
            if (location !== real_path) {
                _logger.debug(`found file: ${location} -> ${real_path}`);
            } else {
                _logger.debug(`found file: ${location}`);
            }
        }
    }
    return files;
};

const get_given_paths = (locations) => {
    return get_with_symlinks(locations).map((e) => e.path);
};

module.exports = (locations, symlinks = false) => {
    if (symlinks) {
        return get_with_symlinks(locations);
    }
    return get_given_paths(locations);
};
