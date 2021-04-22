import path from 'path';
import fs from 'fs';
import { rekeyDevice, deployAndSignPackage, deploy } from 'roku-deploy';
import { generateKey } from '../roku/roku-genkey';

type DeviceProperties = { device?: string, password?: string, username?: string }

const CREDENTIALS_FILENAME = 'credentials.json'
const PACKAGE_EXTENSION = '.pkg'

const RESOURCE_FOLDER_DIRECTORY = 'resources'
const SIGNING_PROJECT_PATH = 'signing-project'

export async function deployProject(projectPath: string, deviceProperties?: DeviceProperties) {
    const finalDeviceProperties = getDeviceProperties(deviceProperties?.device, deviceProperties?.password, deviceProperties?.username)

    // Assert project path exists [AR]
    assertPathExists(projectPath);

    // Deploy project to device [AR]
    await deploy({
        ...finalDeviceProperties,
        project: `${projectPath}/bsconfig.json`,
        rootDir: projectPath,
        stagingFolderPath: './.roku-cli-staging',
        failOnCompileError: true
    });
}


export async function signPackage(projectPath: string, signingPath: string, outputPath: string, packageName: string, deviceProperties?: DeviceProperties) {
    const finalDeviceProperties = getDeviceProperties(deviceProperties?.device, deviceProperties?.password, deviceProperties?.username)
    
    // Assert project path exists [AR]
    assertPathExists(projectPath);

    // Rekey device to application signing properties [AR]
    const signingProperties = parseSigningProperties(signingPath);
    const signedPackagePath = path.resolve(signingProperties.packageFilePath);
    await rekeyDevice({
        ...finalDeviceProperties,
        signingPassword: signingProperties.credentials.password,
        rekeySignedPackage: signedPackagePath,
        devId: signingProperties.credentials.dev_id,
    });

    // Generate new package [AR]
    const generatedPackagePath = await deployAndSignPackage({
        ...finalDeviceProperties,
        project: `${projectPath}/bsconfig.json`,
        rootDir: projectPath,
        signingPassword: signingProperties.credentials.password,
        devId: signingProperties.credentials.dev_id,
        outDir: outputPath,
        outFile: packageName,
        stagingFolderPath: './.roku-cli-staging',
        failOnCompileError: true
    });
    
    return generatedPackagePath;
}


export async function createSigningCredentials(packageName: string, outputPath: string, deviceProperties?: DeviceProperties) {

    const finalDeviceProperties = getDeviceProperties(deviceProperties?.device, deviceProperties?.password, deviceProperties?.username)

    const signingProperties = await generateKey(finalDeviceProperties.host);

    const signingProjectPath = getResourceAt(SIGNING_PROJECT_PATH);

    // Assert project path exists [AR]
    assertPathExists(signingProjectPath);

    const packagePath = await deployAndSignPackage({
        ...finalDeviceProperties,
        rootDir: signingProjectPath,
        signingPassword: signingProperties.password,
        devId: signingProperties.dev_id,
    });

    const outputSigningPath = path.join(outputPath);
    const outputPackagePath = path.join(outputSigningPath, `${packageName}${PACKAGE_EXTENSION}`);
    const outputCredentialsPath = path.join(outputSigningPath, CREDENTIALS_FILENAME);

    if (!fs.existsSync(outputSigningPath)) {
        fs.mkdirSync(outputSigningPath, { recursive: true });
    }
    fs.copyFileSync(packagePath, outputPackagePath);
    fs.writeFileSync(outputCredentialsPath, JSON.stringify(signingProperties));

    return outputPath;
}

export async function executeDeviceRekey(signingPath: string, deviceProperties?: DeviceProperties) {
    
    const signingProperties = parseSigningProperties(signingPath);
    const finalDeviceProperties = getDeviceProperties(deviceProperties?.device, deviceProperties?.password, deviceProperties?.username)

    // Start rekey [AR]
    await rekeyDevice({
        ...finalDeviceProperties,
        signingPassword: signingProperties.credentials.password,
        rekeySignedPackage: path.resolve(signingProperties.packageFilePath),
        devId: signingProperties.credentials.dev_id,
    });
}

function parseSigningProperties(signingPropertiesPath: string) {
    var files = fs.readdirSync(signingPropertiesPath);
    const packageFilename = files.find((filePath) => path.extname(filePath) == PACKAGE_EXTENSION);
    if (!packageFilename) {
        throw Error(`Could not find package at path: ${signingPropertiesPath}`)
    }
    const packageFilePath = path.join(signingPropertiesPath, packageFilename)

    const credentialsFilePath = path.join(signingPropertiesPath, CREDENTIALS_FILENAME)
    if (!path.resolve(credentialsFilePath)) {
        throw Error(`Could not find credentials.json at path: ${credentialsFilePath}`)
    }

    const credentialsData = fs.readFileSync(credentialsFilePath, 'utf-8')
    try {
        const credentials = JSON.parse(credentialsData)
        if (credentials.dev_id && credentials.password) {
            return { credentials, packageFilePath }
        } else {
            throw Error(`Missing required keys on credentials.json: dev_id, password`)
        }
    } catch (error) {
        throw Error(`Could not parse credentials file: ${credentialsFilePath}`)
    }
}

function getResourceAt(resourcePath: string) {
    const resourcesFolderPath = path.resolve(path.join(__dirname, '..', '..', RESOURCE_FOLDER_DIRECTORY))
    return path.resolve(path.join(resourcesFolderPath, resourcePath))
}

function getDeviceProperties(device: string | undefined = undefined, password: string | undefined = undefined, username: string | undefined = undefined) {
    const env = process.env
    const finalHost = device ? device : env.ROKU_DEVICE_ADDRESS
    const finalUsername = username ? username : env.ROKU_DEVICE_USERNAME
    const finalPassword = password ? password : env.ROKU_DEVICE_PASSWORD

    if (finalHost && finalUsername && finalPassword) {
        return { host: finalHost, username: finalUsername, password: finalPassword }
    } else {
        throw Error(`The following device properties should be set: device, password`)
    }
}

function assertPathExists(projectPath: string | undefined) {
    if (!projectPath || !fs.existsSync(projectPath)) {
        throw Error(`Path does not exist: ${projectPath}`)
    }
}
