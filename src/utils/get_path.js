const path = require('path');
module.exports = (location) => {
    if (path.isAbsolute(location)) {
        return location;
    }
    return path.resolve(process.cwd(), location);
};
