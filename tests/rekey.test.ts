

import { executeDeviceRekey } from '../src/roku/roku-api';

const testDeviceProperties = {
    device: '192.168.0.6',
    username: 'rokudev',
    password: '4551'
}

describe('rekey device tests', () => {
    test('rekey should fail with no device specified', async () => {
        try {
            await executeDeviceRekey('tests/resources/signing')
            fail('rekey should have failed')
        } catch (error) {
            expect(error.message).toEqual('The following device properties should be set: device, password')
        }
    });

    test('rekey should fail with invalid signing credentials path', async () => {
        try {
            await executeDeviceRekey('path/doesnt/exist', testDeviceProperties)
            fail('rekey should have failed')
        } catch (error) {
            expect(error.message).toEqual('ENOENT: no such file or directory, scandir \'path/doesnt/exist\'')
        }
    });

    test('rekey should succeed', async () => {
        try {
            await executeDeviceRekey('tests/resources/signing', testDeviceProperties)
        } catch (error) {
            fail(error.message)
        }
    }, 30000);
});