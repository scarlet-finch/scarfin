#! /usr/bin/env node
'use strict';
const commandLineArgs = require('command-line-args');
const fq = require('fuzzquire');
const winston = require('winston');
const migrate = fq('migrate');

const parse_args = () => {
    const defs = [
        { name: 'command', defaultOption: true, defaultValue: 'help' },
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

    const commands = ['sync, check'];

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
            _logger.notice(
                'A flexible image tagger/query tool. Beets for images.'
            );
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
