#! /usr/bin/env node
'use strict';
const commandLineArgs = require('command-line-args');
const fq = require('fuzzquire');
const winston = require('winston');
const migrate = fq('migrate');

const commands = 'status check sync tags devices housekeep mount info'.split(
    ' '
);

// from https://asciiart.website/index.php?art=animals/birds%20(land)
const bird = String.raw`
            _.----._
          ,'.::.--..:._
         /::/_,-<o)::;_@-._
        ::::::::@-';'@,--@-@
        ;::;'|::::,','
      ,'::/  ;:::/, :.
     /,':/  /::;' \ ':\
    :'.:: ,-''   . @.::\
    \.:;':.    @    :: .:
    (;' ;;;       .::' :|
     \,:;;      \ @::.\.\
     @);'        '::'  @:
      \.  @        @'  .:      _,'
       @.: ..  -. ' :. :/  _.-' _.
         >;._.:._.;,-=_(.-'  __ @.
       ,;'  _..-((((''  .,-''  @-
    _,'<.-''  _..@@'.'@-'@.       
_.-((((_..--''       \ \ @.@.
`
    .replace(/@/g, '`')
    .replace('\n', '');

const ascii = String.raw`
                    _      _   
                   | |    | |  
 ___  ___ __ _ _ __| | ___| |_ 
/ __|/ __/ _' | '__| |/ _ \ __|
\__ \ (_| (_| | |  | |  __/ |_ 
|___/\___\__,_|_|  |_|\___|\__/
----------------
  __ _            _
 / _(_)          | |    
| |_ _ _ __   ___| |__  
|  _| | '_ \ / __| '_ \ 
| | | | | | | (__| | | |
|_| |_|_| |_|\___|_| |_|
------------

a flexible image tagger/query tool.
https://github.com/scarlet-finch/scarfin
`.replace('\n', '');

const get_banner = () => {
    let banner = [];
    const a = bird.split('\n');
    const b = ascii.split('\n');
    for (let i = 0; i < 18; i++) {
        const b_str = b[i] || '';
        banner.push(a[i].padEnd(36) + b_str);
    }
    return banner.join('\n');
};

const help_text = `${get_banner()}

    basics
    ========

    commands: ${commands.join(`\n${' '.repeat(14)}`)}
    use 'scarfin <command> --help' to read more
    use 'scarfin help' to show this document
    use verbose flag (-vvv) to increase logging output

    usage example
    =============

    As a minimum viable usecase, point scarfin to a folder of your images
    and let it index/process them. Then use scarfin to mount those images
    for you in some other directory.

    First, let's sync these photos so scarfin knows about them. You might
    heve to use '--force' with images that already have some unique id.

        $ scarfin sync -- /path/to/my/photos

    This next step is needed while scarfin is in alpha for sanity checks.

        $ scarfin housekeep

    Now, we can mount your files somewhere and scarfin should do something
    reasonable to show you the kind off powerful stuff that is possible.

        $ scarfin mount /path/to/mount/target --all --map calendar

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

    const help_commands = 'mount info'.split(' '); // commmands that have help pages.
    if (opts.help && !help_commands.includes(opts.command)) {
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
        case 'info':
            fq('commands/info')(opts);
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
