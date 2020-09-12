const path = require('path');
const glob = require('glob');
const fs = require('fs');

module.exports = (locations) => {
    const files = [];
    for (location of locations) {
        if (!path.isAbsolute(location)) {
            location = path.resolve(process.cwd(), location);
        }
        if (fs.lstatSync(location).isDirectory()) {
            let all_files = glob.sync(
                path.join(location, '/**/*.{jpg,jpeg,JPG,JPEG}')
            );
            for (f of all_files) {
                files.push(f);
                _logger.debug(`found file: ${f}`);
            }
        } else {
            files.push(location);
        }
    }
    return files;
};
