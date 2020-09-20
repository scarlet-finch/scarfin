const moment = require('moment');

module.exports = {
    name: 'flat',
    description: 'mount images as a flat directory listed by date-taken',
    map: (files) => {
        const paths = [];
        for (file of files) {
            const date = moment(file.date_taken);
            paths.push({
                from: file.File.path,
                to: `${date.toISOString()}.jpg`,
            });
        }
        return paths;
    },
};
