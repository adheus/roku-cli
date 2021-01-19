import fs from 'fs';

import { testDeviceProperties } from "./test-device";
import { signPackage } from '../src/roku/roku-api';

// Remove results directory before running tests
beforeAll(() => fs.rmSync('tests/out', { recursive: true, force:true }));

describe('sign package tests', () => {
    test('signing should fail with no device specified', async () => {
        try {
            await signPackage('resources/signing-project', 'tests/resources/signing', 'tests/out/packages', 'newSignedPackage')
            fail('signing should have failed')
        } catch (error) {
            expect(error.message).toEqual('The following device properties should be set: device, password')
        }
    }, 5000);

    test('signing should fail with invalid project path', async () => {
        try {
            await signPackage('path/doesnt/exist', 'tests/resources/signing', 'tests/out/packages', 'newSignedPackage', testDeviceProperties)
            fail('signing should have failed')
        } catch (error) {
            expect(error.message).toContain('rootDir does not exist at')
        }
    });

    test('signing should succeed', async () => {
        try {
            const packagePath = await signPackage('resources/signing-project', 'tests/resources/signing', 'tests/out/packages/', 'newSignedPackage', testDeviceProperties)
            expect(fs.existsSync(packagePath)).toEqual(true)
        } catch (error) {
            fail(error.message)
        }
    }, 30000);
});