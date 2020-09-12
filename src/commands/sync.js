const fq = require('fuzzquire');
const get_path = fq('get_path');
const exif = fq('exif');

module.exports = async (opts) => {
    opts = opts.map((e) => get_path(e));
    const { uuid_list, write_count } = await exif(opts);
    for (e of uuid_list) {
        _logger.debug(`uuid-list ${e.uuid} - ${e.path}`);
    }
    _logger.success(`synced ${uuid_list.length} files`);
    _logger.notice(`added ${write_count} new files`);
};
