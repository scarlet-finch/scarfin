const moment = require('moment');
const path = require('path');

module.exports = {
    name: 'calendar',
    description: 'mount images inside year/month/day directories',
    map: (files) => {
        const paths = [];
        for (file of files) {
            const date = moment(file.dateTaken);
            paths.push({
                from: file.path,
                to: `${date.year()}/${date.format('MMMM')}/${date.format(
                    'DD'
                )}/${path.basename(file.path)}`,
            });
        }
        return paths;
    },
};
