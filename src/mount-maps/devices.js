const path = require('path');

const name = 'devices';
const description = 'create folders by device';
const map = (files) => {
    const pairs = [];
    for (file of files) {
        pairs.push({
            from: file.path,
            to: `${file.device}/${path.basename(file.path)}`,
        });
    }
    return pairs;
};

// This bit is important to let scarfin import the files.
module.exports = {
    name,
    description,
    map,
};
