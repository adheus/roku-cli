#!/usr/bin/env node

import { createSigningCredentials, deployProject, executeDeviceRekey, signPackage } from '../roku/roku-api';
import { logSuccess, logInfo, logError } from '../utils/pretty-log';

const argv = require('yargs/yargs')(process.argv.slice(2))
    .command(
        'deploy',
        'deploys a roku package',
        {
            path: {
                alias: 'p',
                demandOption: true,
                describe: 'path to roku project',
                normalize: true,
                type: 'string'
            },
        },
        async (argv: { path: string, device?: string, password?: string, username: string }) => {
            try {
                const outputPath = await deployProject(argv.path, argv)
                logSuccess(`Application was successfully deployed`)
            } catch (error) {
                logError(error.message)
                process.exit(1)
            }
        })
    .command(
        'sign',
        'signs a roku package',
        {
            name: {
                alias: 'n',
                describe: 'application package name (without .pkg)',
                default: 'app',
                type: 'string'
            },
            path: {
                alias: 'p',
                demandOption: true,
                describe: 'path to roku project',
                normalize: true,
                type: 'string'
            },
            signing: {
                alias: 's',
                demandOption: true,
                describe: 'path to signing properties folder',
                normalize: true,
                type: 'string'
            },
            output: {
                alias: 'o',
                describe: 'path to where the package should be saved',
                default: './',
                normalize: true,
                type: 'string'
            }
        }, async (argv: { name: string, path: string, signing: string, output: string, device?: string, password?: string, username: string }) => {
            try {
                const outputPath = await signPackage(argv.path, argv.signing, argv.output, argv.name, argv)
                logSuccess(`Package signed and stored at: ${outputPath}`)
            } catch (error) {
                logError(error.message)
                process.exit(1)
            }
        })
    .command(
        'rekey',
        'rekeys roku device',
        {
            signing: {
                alias: 's',
                demandOption: true,
                describe: 'path to signing properties folder',
                normalize: true,
                type: 'string'
            }
        }, async (argv: { signing: string, device?: string, password?: string, username: string }) => {
            try {
                await executeDeviceRekey(argv.signing, argv)
                logSuccess('Device rekey applied.')
            } catch (error) {
                logError(error.message)
                process.exit(1)
            }
        })
    .command(
        'create-signing-credentials',
        'creates new signing properties for an app (dev_id, password, package)',
        {
            name: {
                alias: 'n',
                describe: 'output package file name',
                default: 'app',
                type: 'string'
            },
            output: {
                alias: 'o',
                describe: 'path to where signing properties should be saved',
                default: './',
                normalize: true,
                type: 'string'
            }
        }, async (argv: { name: string, output: string, device?: string, password?: string, username: string }) => {
            try {
                const outputPath = await createSigningCredentials(argv.name, argv.output, argv)
                logSuccess(`Signing credentials generated and stored at: ${outputPath}`)
            } catch (error) {
                logError(error.message)
                process.exit(1)
            }
        })
    .options({
        'device': {
            alias: 'd',
            describe: 'network address of the roku device. also could be set set through the environment variable: ROKU_DEVICE_ADDRESS',
            type: 'string'
        },
        'password': {
            alias: 'w',
            describe: 'password of the roku device. also could be set through the environment variable: ROKU_DEVICE_PASSWORD',
            type: 'string'
        },
        'username': {
            alias: 'u',
            describe: 'password of the roku device. also could be set through the environment variable: ROKU_DEVICE_PASSWORD',
            default: 'rokudev',
            type: 'string'
        }
    })
    .demandCommand(1)
    .strict()
    .help()
    .argv
