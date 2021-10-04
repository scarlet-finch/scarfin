const path = require('path');

const name = 'tags';
const description = 'create folders by tags';
const map = (files) => {
    const pairs = [];
    for (file of files) {
        for (tag of file.tags) {
            pairs.push({
                from: file.path,
                to: `${tag.name}/${path.basename(file.path)}`,
            });
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
