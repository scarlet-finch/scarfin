const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);
const fs = require('fs');
const fq = require('fuzzquire');
const uuid = require('uuid');

let write_count;

const write_uuid = async (ep, file) => {
    const new_uuid = uuid.v4();
    await ep.writeMetadata(
        file,
        {
            ImageUniqueID: `uuid:${new_uuid}`,
            DocumentName: `uuid:${new_uuid}`, // backup field
        },
        ['overwrite_original']
    );
    return new_uuid;
};

const get_exif = async (ep, file) => {
    if (!fs.existsSync(file)) {
        _logger.error(`file not found: ${file}`);
        return false;
    }
    const metadata = await ep.readMetadata(file, ['-File:all']);
    if (!metadata.data || metadata.data[0].Error) {
        _logger.error(`no exif metadata in file: ${file}`);
        return false;
    }
    return metadata;
};

const handle_file = async (ep, file) => {
    const metadata = await get_exif(ep, file);
    if (metadata === false) {
        return false;
    }
    let existing_uuid = metadata.data[0].ImageUniqueID;
    if (existing_uuid) {
        existing_uuid = existing_uuid.replace('uuid:', '');
    }
    if (existing_uuid && !uuid.validate(existing_uuid)) {
        _logger.error(`invalid uuid '${existing_uuid}'in file: ${file}`);
        return false;
    }
    if (!existing_uuid) {
        _logger.debug(`>>>> writing uuid for: ${file}`);
        write_count++;
        const new_uuid = await write_uuid(ep, file);
        return {
            path: file,
            uuid: new_uuid,
        };
    } else {
        _logger.debug(`---- found uuid for: ${file}`);
        return {
            path: file,
            uuid: existing_uuid,
        };
    }
};

module.exports = async (opts) => {
    const uuid_list = [];
    write_count = 0;
    try {
        const data = {
            comment: 'teststring', // has to come after `all` in order not to be removed
            'Keywords+': ['keywordA', 'keywordB'],
        };
        const pid = await ep.open();
        _logger.info(`exiftool process started as ${pid}`);
        for (file of opts) {
            const uuid_info = await handle_file(ep, file);
            if (uuid_info === false) {
                // something wrong happened; leave it.
                continue;
            }
            uuid_list.push(uuid_info);
        }
        _logger.info(`exiftool process stopped`);
    } catch (e) {
        _logger.error(e);
    }
    ep.close();
    return {
        uuid_list,
        write_count,
    };
};
