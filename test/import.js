const assert = require('assert');
const fq = require('fuzzquire');
const db = fq('models');
const fs = require('fs/promises');
const migrate = fq('migrate');
const sync = fq('commands/sync');
const paths = fq('paths');
const status = fq('commands/status');
global._logger = fq('logger')('emerg'); // we do not want logging in tests

describe('import pipeline', function () {
    before(async () => {
        // clean the database
        await db.sequelize.sync({ force: true });
        await migrate();
    });

    it('should find all files', async function () {
        const file_paths = await paths(['test/data-working-copy']);
        assert.strictEqual(file_paths.length, 12);
    });
    it('should only write exif for new files', async function () {
        const e = await sync({
            files: ['test/data-working-copy'],
            force: false,
        });
        assert.strictEqual(e.write_count, 9);
        assert.strictEqual(e.db_add_count, 12);
        assert.strictEqual(e.db_update_count, 0);
        assert.strictEqual(e.metadata_list.length, 12);
        assert.strictEqual(e.device_add_count, 1);
    });
    it('should not do anything when nothing changes', async function () {
        const e = await sync({
            files: ['test/data-working-copy'],
            force: false,
        });
        assert.strictEqual(e.write_count, 0);
        assert.strictEqual(e.db_add_count, 0);
        assert.strictEqual(e.db_update_count, 0);
        assert.strictEqual(e.metadata_list.length, 12);
        assert.strictEqual(e.device_add_count, 0);
    });
    it('should reconcile renamed files', async function () {
        await fs.rename(
            'test/data-working-copy/1.jpg',
            'test/data-working-copy/01.jpg'
        );
        await fs.rename(
            'test/data-working-copy/2.jpg',
            'test/data-working-copy/02.jpg'
        );
        const e = await sync({
            files: ['test/data-working-copy'],
            force: true,
        });
        assert.strictEqual(e.write_count, 0);
        assert.strictEqual(e.db_add_count, 0);
        assert.strictEqual(e.db_update_count, 2);
        assert.strictEqual(e.metadata_list.length, 12);
        assert.strictEqual(e.device_add_count, 0);
    });
    it('should finally have 12 files in database', async () => {
        const status_data = await status();
        assert.strictEqual(status_data.num_files, 12);
    });
});
