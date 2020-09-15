#! /usr/bin/env node
'use strict';
const commandLineArgs = require('command-line-args');
const fq = require('fuzzquire');
const winston = require('winston');
const migrate = fq('migrate');

const commands = 'status check sync tags devices housekeep mount'.split(' ');

const help_text = `
           .__              .__
    ______ |__|__  ___ ____ |  |
    \\____ \\|  \\  \\/  // __ \\|  |
    |  |_> >  |>    <\\  ___/|  |__
    |   __/|__/__/\\_ \\\\___  >____/
    |__|            \\/    \\/

    pixel: a flexible image tagger/query tool. beets for images.

    basics
    ========

    commands: ${commands.join(`\n${' '.repeat(14)}`)},
    use 'pixel <command> --help' to read more
    use 'pixel help' to show this document
    use verbose flag (-vvv) to increase logging output

    usage example
    =============

    As a minimum viable usecase, point pixel to a folder of your images
    and let it index/process them. Then use pixel to mount those images
    for you in some other directory.

    First, let's sync these photos so pixel knows about them. You might
    heve to use '--force' with images that already have some unique id.

        $ pixel sync -- /path/to/my/photos

    This next step is needed while pixel is in alpha for sanity checks.

        $ pixel housekeep

    Now, we can mount your files somewhere and pixel should do something
    reasonable to show you the kind off powerful stuff that is possible.

        $ pixel mount /path/to/mount/target --all

    Now, you can go to the location where you mounted your images and
    explore around. To unmount, just delete the directory. Your images
    will stay safely where they originally were.`;

const parse_args = () => {
    const defs = [
        { name: 'command', defaultOption: true, defaultValue: 'help' },
        { name: 'help', defaultValue: false, type: Boolean },
        {
            name: 'verbose',
            type: Boolean,
            defaultValue: [],
            alias: 'v',
            lazyMultiple: true,
        },
    ];
    const opts = commandLineArgs(defs, {
        stopAtFirstUnknown: false,
        partial: true,
    });
    opts.argv = opts._unknown || [];
    return opts;
};

const make_globals = (opts) => {
    let logger;
    switch (opts.verbose.length) {
        case 0:
            logger = fq('logger')('success');
            break;
        case 1:
            logger = fq('logger')('help');
            break;
        default:
            logger = fq('logger')('debug');
            break;
    }
    global._logger = logger;

    const config = fq('config_loader');
    global._config = config;

    if (config.help_messages == true && opts.verbose.length === 0) {
        global._logger = fq('logger')('help');
    }
};

const main = async () => {
    const opts = parse_args();
    make_globals(opts);

    _logger.help(
        'help messages are enabled. set `help_messages: false` in config to disable'
    );

    await migrate(); // Apply pending db migrations

    if (opts.help) {
        console.log();
        console.log(
            '    help pages coming soon. its the wild west for now, cowboy!'
        );
        console.log(
            '    give garbage input to commands to make them shout at you.'
        );
        process.exit();
    }

    switch (opts.command) {
        case 'sync':
            fq('sync')(opts);
            break;
        case 'check':
            fq('check')(opts);
            break;
        case 'status':
            fq('status')(opts);
            break;
        case 'device':
        case 'devices':
            fq('commands/devices')(opts);
            break;
        case 'tag':
        case 'tags':
            fq('commands/tags')(opts);
            break;
        case 'housekeep':
        case 'housekeeping':
            fq('commands/housekeep')(opts);
            break;
        case 'mount':
            fq('commands/mount')(opts);
            break;
        case 'help':
            console.log(help_text);
            break;
        case 'test':
            fq('test')(opts);
            break;
        default:
            _logger.alert(`unknown command: ${command}`);
            _logger.alert(`valid commands are: ${commands}`);
    }
};

main();
