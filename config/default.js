// Scarfin reads config from ~/.scarfin/config.js

module.exports = {
    // EXIF data usually doesn't contain timezone info.
    // Specify deault timezone to use for such cases.
    default_utc_offset: '+00:00',

    // Scarfin tries to give small hints during runtime.
    // set this to false to turn them off.
    help_messages: true,

    // Scarfin by default reads your files whenever you try
    // access the exif data. Setting this to false makes
    // Scarfin read the exif data from the internal database
    // which is somewhat faster.

    // By setting this to false, you're making an implicit
    // agreement to not use other tools to edit the EXIF data
    // or move the original files around.
    read_paths: true,
};
