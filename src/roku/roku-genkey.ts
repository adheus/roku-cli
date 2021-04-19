import Telnet from 'telnet-client';
import { sleep } from '../utils/async-utils';

const DEFAULT_INTERVAL_BETWEEN_OPERATIONS = 3000;

export async function generateKey(deviceAddress: string) {
    let connection = new Telnet();
    let params = {
        host: deviceAddress,
        port: 8080,
        shellPrompt: '>',
        timeout: 8000,
        execTimeout: 8000
    }

    try {
        await connection.connect(params);
        await waitForDeviceToBeReady()
        const response = await connection.exec('genkey');
        await waitForDeviceToBeReady()
        await connection.end();

        const password = extractVariable("Password", response);
        const dev_id = extractVariable("DevID", response);

        if (password && dev_id) {
            return { dev_id, password }
        } else {
            throw Error(`Could not generate key: Failed to retrieve DevID/password from Roku device[${deviceAddress}].`)
        }

    } catch (error) {
        await connection.destroy();
        throw Error(`Could not generate key: Failed to connect to Roku device[${deviceAddress}].`)
    }
}

function extractVariable(variableName: string, response: string): string | undefined {
    const variableRegex = new RegExp(`${variableName}: ([^\r\n]*)`);
    const matches = variableRegex.exec(response);
    if (matches) {
        const value = matches[1];
        return value;
    }

    return undefined;
}

// For now, we don't have a way to know when the device is ready for
// other operations, but it seems that giving some interval between actions
// improve the succcess rate of the implemented operations [AR]
function waitForDeviceToBeReady() {
    sleep(DEFAULT_INTERVAL_BETWEEN_OPERATIONS);
}
