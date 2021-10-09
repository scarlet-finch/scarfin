const assert = require('assert');
const fq = require('fuzzquire');
const db = fq('models');
const migrate = fq('migrate');
const status = fq('commands/status');
global._logger = fq('logger')('emerg'); // we do not want logging in tests

describe('database sanity', function () {
    beforeEach(async () => {
        // clean the database
        await db.sequelize.sync({ force: true });
        await migrate();
    });
    it('should have 5 tags by default', async function () {
        const status_data = await status();
        assert.strictEqual(status_data.num_tags, 5);
    });
    it('should have 1 device by default', async function () {
        const status_data = await status();
        assert.strictEqual(status_data.num_devices, 1);
    });
    it('should have 0 files by default', async function () {
        const status_data = await status();
        assert.strictEqual(status_data.num_files, 0);
    });
    it('should have 1 extra tag now', async function () {
        const obj = await db.Tags.create({
            name: 'testing',
            type: 'user-defined',
        });
        const status_data = await status();
        assert.strictEqual(status_data.num_tags, 6);
    });
});
