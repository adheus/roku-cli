import fs from 'fs';
import path from 'path';

import { createSigningCredentials } from '../src/roku/roku-api';

const testDeviceProperties = { 
    device: '192.168.0.6', 
    username:'rokudev', 
    password: '4551'
}

describe('create signing credentials tests', () => {
    test('create signing credentials with no device properties should fail', async () => {
        try {
            await createSigningCredentials('test_app', './out/tests/signing')
            fail('create credentials should have failed')
        } catch (error) {
            expect(error.message).toEqual('The following device properties should be set: device, password')
        }
    });

    test('create signing credentials should succeed', async () => {
        try {
        const appName = 'test_app'
        const credentialsPath = await createSigningCredentials(appName, './out/tests/signing', testDeviceProperties)
        expect(fs.existsSync(credentialsPath)).toEqual(true)
        expect(fs.existsSync(path.join(credentialsPath, `${appName}.pkg`))) .toEqual(true)
        expect(fs.existsSync(path.join(credentialsPath, 'credentials.json'))) .toEqual(true)
        } catch(error) {
            fail(error.message)
        }
    }, 30000);
});