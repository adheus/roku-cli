import path from 'path';
import fs from 'fs';
import { rekeyDevice, deployAndSignPackage, deleteInstalledChannel } from 'roku-deploy';

import { generateKey } from '../roku/roku-genkey';

type DeviceProperties = { device?: string, password?: string, username?: string }

const CREDENTIALS_FILENAME = 'credentials.json'
const PACKAGE_EXTENSION = '.pkg'

const RESOURCE_FOLDER_PATH = '../resources'
const SIGNING_PROJECT_PATH = 'signing-project'

const DEFAULT_OUTPUT_DIRECTORY = 'out'

export async function signPackage(projectPath: string, signingPath: string, outputPath: string, packageName: string, deviceProperties?: DeviceProperties) {
    const finalDeviceProperties = getDeviceProperties(deviceProperties?.device, deviceProperties?.password, deviceProperties?.username)
    // Clear current installed channel [AR]
    deleteInstalledChannel({ ...finalDeviceProperties })

    // Rekey device to application signing properties [AR]
    const signingProperties = parseSigningProperties(signingPath)

    await rekeyDevice({
        ...finalDeviceProperties,
        signingPassword: signingProperties.credentials.password,
        rekeySignedPackage: path.resolve(signingProperties.packageFilePath),
        devId: signingProperties.credentials.dev_id
    })

    // Generate new package [AR]
    const generatedPackagePath = await deployAndSignPackage({
        ...finalDeviceProperties,
        project: `${projectPath}/bsconfig.json`,
        rootDir: projectPath,
        signingPassword: signingProperties.credentials.password,
        devId: signingProperties.credentials.dev_id
    });

    // Create output path directory if it doesn't exist [AR]
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
    }
    // Copy generated package to output path [AR]
    const packageOutputPath = path.join(outputPath, `${packageName}${PACKAGE_EXTENSION}`);
    fs.copyFileSync(generatedPackagePath, packageOutputPath)


    // Clear ./out directory [AR]
    cleanOutDirectory()

    return packageOutputPath
}


export async function createSigningCredentials(packageName: string, outputPath: string, deviceProperties?: DeviceProperties) {

    const finalDeviceProperties = getDeviceProperties(deviceProperties?.device, deviceProperties?.password, deviceProperties?.username)

    // Clear current installed channel [AR]
    deleteInstalledChannel({ ...finalDeviceProperties })

    const signingProperties = await generateKey(finalDeviceProperties.host)

    const signingProjectPath = getResourceAt(SIGNING_PROJECT_PATH)

    const packagePath = await deployAndSignPackage({
        ...finalDeviceProperties,
        rootDir: signingProjectPath,
        signingPassword: signingProperties.password,
        devId: signingProperties.dev_id
    });

    const outputSigningPath = path.join(outputPath)
    const outputPackagePath = path.join(outputSigningPath, `${packageName}${PACKAGE_EXTENSION}`)
    const outputCredentialsPath = path.join(outputSigningPath, CREDENTIALS_FILENAME)

    if (!fs.existsSync(outputSigningPath)) {
        fs.mkdirSync(outputSigningPath, { recursive: true })
    }
    fs.copyFileSync(packagePath, outputPackagePath)
    fs.writeFileSync(outputCredentialsPath, JSON.stringify(signingProperties))

    return outputPath
}

export async function executeDeviceRekey(signingPath: string, deviceProperties?: DeviceProperties) {

    const signingProperties = parseSigningProperties(signingPath)

    await rekeyDevice({
        ...getDeviceProperties(deviceProperties?.device, deviceProperties?.password, deviceProperties?.username),
        signingPassword: signingProperties.credentials.password,
        rekeySignedPackage: path.resolve(signingProperties.packageFilePath),
        devId: signingProperties.credentials.dev_id
    })
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
    const packagePath = '${__dirname}'
    const resourcesFolderPath = path.join(packagePath, RESOURCE_FOLDER_PATH)
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

function cleanOutDirectory() {
    fs.rmSync(path.resolve(DEFAULT_OUTPUT_DIRECTORY), { recursive: true })
}