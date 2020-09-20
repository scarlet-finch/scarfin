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
    const metadata = await ep.readMetadata(file, ['c "%.6f"']);
    if (!metadata.data || metadata.data[0].Error) {
        _logger.error(`no exif metadata in file: ${file}`);
        return false;
    }
    return metadata;
};

const get_uuids = async (files, strictly_need_uuid = true) => {
    await ep.open();
    let uuids = [];
    for (file of files) {
        const metadata = await get_exif(ep, file);
        if (metadata === false && strictly_need_uuid) {
            _logger.fatal(`no metadata for: ${file}`);
            process.exit(1);
        }
        let existing_uuid = metadata.data[0].ImageUniqueID
            ? metadata.data[0].ImageUniqueID.replace('uuid:', '')
            : false;
        if (
            existing_uuid &&
            !uuid.validate(existing_uuid) &&
            strictly_need_uuid
        ) {
            _logger.fatal(`invalid uuid '${existing_uuid}'in file: ${file}`);
            process.exit(1);
        }
        if (!existing_uuid && strictly_need_uuid) {
            _logger.fatal(`no uuid for: ${file}`);
            process.exit(1);
        }
        uuids.push(existing_uuid);
    }
    await ep.close();
    uuids = uuids.filter((e) => e !== false); // remove empty uuids
    return uuids;
};

const handle_file = async (ep, file, force) => {
    const metadata = await get_exif(ep, file);
    if (metadata === false) {
        return false;
    }
    let existing_uuid = metadata.data[0].ImageUniqueID;
    if (existing_uuid) {
        existing_uuid = existing_uuid.replace('uuid:', '');
    }
    let overwrite = false;
    if (existing_uuid && !uuid.validate(existing_uuid)) {
        _logger.error(`invalid uuid '${existing_uuid}'in file: ${file}`);
        if (force) {
            _logger.alert(`overwriting original ImageUniqueID field`);
            overwrite = true;
        } else {
            _logger.alert(`use --force to overwrite ImageUniqueID field`);
            return false;
        }
    }
    if (!existing_uuid || overwrite) {
        _logger.debug(`>>>> writing uuid for: ${file}`);
        write_count++;
        const new_uuid = await write_uuid(ep, file);
        return {
            path: file,
            uuid: new_uuid,
            metadata: metadata,
        };
    } else {
        _logger.debug(`---- found uuid for: ${file}`);
        return {
            path: file,
            uuid: existing_uuid,
            metadata: metadata,
        };
    }
};

const read_write_uuid_info = async (opts, force) => {
    const metadata_list = [];
    write_count = 0;
    try {
        const data = {
            comment: 'teststring', // has to come after `all` in order not to be removed
            'Keywords+': ['keywordA', 'keywordB'],
        };
        const pid = await ep.open();
        _logger.info(`exiftool process started as ${pid}`);
        for (file of opts) {
            const metadata_info = await handle_file(ep, file, force);
            if (metadata_info === false) {
                // something wrong happened; leave it.
                continue;
            }
            metadata_list.push(metadata_info);
        }
    } catch (e) {
        _logger.error(e);
    } finally {
        await ep.close();
        _logger.info(`exiftool process stopped`);
    }
    return {
        metadata_list,
        write_count,
    };
};

module.exports = {
    read_write_uuid_info,
    get_exif,
    get_uuids,
};
