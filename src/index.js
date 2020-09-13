#! /usr/bin/env node
'use strict';
const meow = require('meow');
const fq = require('fuzzquire');
const winston = require('winston');
const migrate = fq('migrate');

const main = async () => {
    const cli = meow(
        `
    Usage
      $ pixel <command> -- <files>

    Commands
      - sync -- <files> - add or update images
      - check -- <files> - check status of images
      - status - print overall system status

    Options
      (nothing here yet)

    Examples
      $ pixel sync foo/*.jpg
          success: synced 90 files
          notice: added 3 new files
`,
        {
            flags: {
                verbose: {
                    type: 'boolean',
                    alias: 'v',
                    default: false,
                },
                metadata: {
                    type: 'boolean',
                    alias: 'm',
                    default: false,
                },
            },
        }
    );

    const [command, ...files] = cli.input;

    let logger;
    if (cli.flags.verbose) {
        logger = fq('logger')('debug');
        global._logger = logger;
    } else {
        logger = fq('logger')('success');
        global._logger = logger;
    }

    await migrate(); // Apply pending db migrations

    const commands = ['sync, check'];

    switch (command) {
        case 'sync':
            fq('sync')(files, cli.flags);
            break;
        case 'check':
            fq('check')(files, cli.flags);
            break;
        case 'status':
            fq('status')(files, cli.flags);
            break;
        case 'device':
        case 'devices':
            fq('commands/devices')(files, cli.flags);
            break;
        case 'tag':
        case 'tags':
            fq('commands/tags')(files, cli.flags);
            break;
        case 'test':
            fq('test')(files, cli.flags);
            break;
        default:
            _logger.alert(`unknown command: ${command}`);
            _logger.alert(`valid commands are: ${commands}`);
    }
};

main();
