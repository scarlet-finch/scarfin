const path = require('path');
const glob = require('glob');
const fs = require('fs');

const valid_extensions = ['jpg', 'jpeg', 'JPG', 'JPEG'];

module.exports = (locations) => {
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
                files.push(f);
                _logger.debug(`found file: ${f}`);
            }
        } else {
            const ext = path.extname(location).replace('.', '');
            if (!valid_extensions.includes(ext)) {
                _logger.alert(`rejecting non jpg file: ${location}`);
                continue;
            } else {
                _logger.debug(`found file: ${location}`);
            }
            files.push(location);
        }
    }
    return files;
};
