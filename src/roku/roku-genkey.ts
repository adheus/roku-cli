import Telnet from 'telnet-client';


export async function generateKey(deviceAddress: string) {
    let connection = new Telnet();
    let params = {
        host: deviceAddress,
        port: 8080,
        shellPrompt: '>',
        timeout: 5000,
        execTimeout: 5000
    }

    try {
        await connection.connect(params);
        const response = await connection.exec('genkey');
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