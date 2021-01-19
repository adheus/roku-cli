import { testDeviceProperties } from "../tests/test-device";
import { deployProject } from "../src/roku/roku-api";

describe('deploy project tests', () => {
    test('deploy should fail with no device specified', async () => {
        try {
            await deployProject('resources/signing-project')
            fail('deploy should have failed')
        } catch (error) {
            expect(error.message).toEqual('The following device properties should be set: device, password')
        }
    });

    test('deploy should fail with invalid project path', async () => {
        try {
            await deployProject('path/doesnt/exist', testDeviceProperties)
            fail('deploy should have failed')
        } catch (error) {
            expect(error.message).toContain('rootDir does not exist')
        }
    });

    test('deploy should succeed', async () => {
        try {
            await deployProject('resources/signing-project', testDeviceProperties)
        } catch (error) {
            fail(error.message)
        }
    }, 30000);
});