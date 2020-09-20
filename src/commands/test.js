const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);
const fs = require('fs');
const fq = require('fuzzquire');
const db = fq('models');

module.exports = async (opts) => {
    let file_okay_count = 0;
    try {
        console.log('OPTS', opts);
        const mounts = fq('mount-maps');
        console.log(mounts);
    } catch (e) {
        console.log(e);
        _logger.error(e);
    }
};
