const path = require('path');
const moment = require('moment');

const name = 'tags';
const description = 'create folders by tags';
const map = (files) => {
    const pairs = [];
    for (file of files) {
        for (tag of file.tags) {
            const date = moment(file.dateTaken);
            if (date.isValid()) {
                pairs.push({
                    from: file.path,
                    to: `${tag.name}/${date.toISOString()}${path.extname(
                        file.path
                    )}`,
                });
            }
        }
    }
    return pairs;
};

// This bit is important to let scarfin import the files.
module.exports = {
    name,
    description,
    map,
};
