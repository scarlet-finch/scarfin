#! /usr/bin/env node
'use strict';
const meow = require('meow');
const fq = require('fuzzquire');
const winston = require ('winston')

const cli = meow(
    `
    Usage
      $ pixel <command> -- <files>

    Commands
      - sync -- <files> - add or update images
      - check -- <files> - check status of images

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

const commands = ['sync, check'];

switch (command) {
    case 'sync':
        fq('sync')(files);
        break;
    case 'check':
        fq('check')(files);
        break;
    case 'test':
        fq('test')(files);
        break;
    default:
        _logger.alert(`unknown command: ${command}`);
        _logger.alert(`valid commands are: ${commands}`)
}
