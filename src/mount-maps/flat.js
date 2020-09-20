const moment = require('moment');

module.exports = {
    name: 'flat',
    description: 'mount images as a flat directory listed by date-taken',
    map: (files) => {
        const paths = [];
        for (file of files) {
            const date = moment(file.dateTaken);
            paths.push({
                from: file.path,
                to: `${date.toISOString()}.jpg`,
            });
        }
        return paths;
    },
};
