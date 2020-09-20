// This is a mounting map template. Modify this to suit your needs.

// Copy this file to ~/.scarfin/maps/your-map.js.
// Run 'scarfin status' to see your newly added map detected.
// Use '--dry' with 'scarfin mount' to check what your map would do.

// import modules you need.
const path = require('path');

const name = 'my-great-map';
const description = 'this is a map that does foo';
const map = (files) => {
    const pairs = [];
    // All mappings/symlinks you are creating go here.
    // example: pairs = ['/from/image-123.jpg', '/to/fancy-name.jpg']

    // Do something with each file.
    for (file of files) {
        // To explore what the file object contains, start by uncommenting this line:
        // console.log(file);

        // For now, we shall put all files in folders that are named after their first
        // letter.
        const name = path.basename(file.path);
        const new_path = `${name[0]}/${name}`;

        // Let's push this new path to our pairs of paths to link.
        pairs.push({
            from: file.path,
            to: new_path,
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
