import chalk from 'chalk';

const TOOL_PREFIX = '[roku-cli]'

type LogStyle = { prefix:string, color:chalk.Chalk }

const WARNING:LogStyle = { prefix: '[WARNING]', color: chalk.yellow };
const INFO:LogStyle = { prefix: '[INFO]', color: chalk.blue };
const SUCCESS:LogStyle = { prefix: '[SUCCESS]', color: chalk.green };
const ERROR:LogStyle = { prefix: '[ERROR]', color: chalk.red };

export function logWarning(message:string) {
    prettyLog(WARNING, message)
}

export function logInfo(message:string) {
    prettyLog(INFO, message)
}

export function logSuccess(message?:string) {
    prettyLog(SUCCESS, message)
}

export function logError(message:string) {
    prettyLog(ERROR, message)
}


function prettyLog(style: LogStyle, message?:string) {
    console.log(style.color(`${TOOL_PREFIX}${style.prefix}${ message ? `: ${message}`: ''}`))
}