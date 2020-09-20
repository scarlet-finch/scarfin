const moment = require('moment');
const path = require('path');

module.exports = {
    name: 'calendar',
    description: 'mount images inside year/month/day directories',
    map: (files) => {
        const paths = [];
        for (file of files) {
            const date = moment(file.date_taken);
            paths.push({
                from: file.File.path,
                to: `${date.year()}/${date.format('MMMM')}/${date.format(
                    'DD'
                )}/${path.basename(file.File.path)}`,
            });
        }
        return paths;
    },
};
