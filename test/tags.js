const assert = require('assert');
const fq = require('fuzzquire');
const db = fq('models');
const migrate = fq('migrate');
const sync = fq('commands/sync');
global._logger = fq('logger')('emerg'); // we do not want logging in tests

// modules to test
const tags_command = fq('commands/tags');
const api = fq('api');

const call = async (argv) => {
    const opts = {
        argv: argv.split(' '),
    };
    return await tags_command(opts);
};

describe('tags pipeline', function () {
    before(async () => {
        // clean the database
        await db.sequelize.sync({ force: true });
        await migrate();
        // import files
        await sync({
            files: ['test/data-working-copy'],
            force: false,
        });
    });

    it('command should list default tags', async function () {
        const tags = await call('list --all --show-unused');
        assert.strictEqual(tags.length, 5);
        assert.deepStrictEqual(
            tags.sort(),
            [
                'for-social',
                'to-delete',
                'wallpapers',
                'to-print',
                'for-guests',
            ].sort()
        );
    });
    it('command should list no tags with show-unused=false', async function () {
        const tags = await call('list --all');
        assert.strictEqual(tags.length, 0);
    });
    it('api should list all tags', async function () {
        const tags = await api.tags.list({
            show_unused: true,
        });
        assert.strictEqual(tags.length, 5);
    });
    it('api should list no tags with show-unused=false', async function () {
        const tags = await api.tags.list();
        assert.strictEqual(tags.length, 0);
    });
    it('command should add tag to 3 files', async function () {
        await call('add foo -- test/data-working-copy/subdir');
        const uuids = await api.tags.find_files('foo');
        assert.strictEqual(uuids.length, 3);
    });
    it('command should add 2 tags to all files', async function () {
        await call('add bar baz -- test/data-working-copy');
        const uuids_bar = await api.tags.find_files('bar');
        const uuids_baz = await api.tags.find_files('baz');
        assert.strictEqual(uuids_bar.length, 12);
        assert.strictEqual(uuids_baz.length, 12);
    });
    it('command should remove 2 tags from 3 files', async function () {
        await call('remove bar baz -- test/data-working-copy/subdir');
        const uuids_bar = await api.tags.find_files('bar');
        const uuids_baz = await api.tags.find_files('baz');
        assert.strictEqual(uuids_bar.length, 9);
        assert.strictEqual(uuids_baz.length, 9);
    });
    it('command should finally list 3 tags in use', async function () {
        const tags = await call('list --all');
        assert.strictEqual(tags.length, 3);
        assert.deepStrictEqual(tags.sort(), ['foo', 'bar', 'baz'].sort());
    });
});
