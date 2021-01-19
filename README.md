# roku-cli
A CLI tool for signing Roku packages

#### Supported commands are:

### roku deploy
Deploy the given project to the Roku device
#### Required arguments:
- `-p` or `--path` - path to the roku project

### roku sign
Deploys, rekey the device(if needed) with the given signing credentials file and signs the package.
#### Required arguments:
- `-n` or `--name` - application package name (without .pkg). defaults to 'app'
- `-p` or `--path` - path to the roku project
- `-s` or `--signing` - path to signing properties folder. This folder must be a folder containing the previous .pkg file and a signing credentials file.
- `-o` or `--output` - path to where the package should be saved. defaults to current working directory

### roku rekey
Rekeys a given Roku device by reading the dev_id and password in the given signing properties file.
#### Required arguments:
- `-s` or `--signing` - path to signing properties folder. This folder must be a folder containing the previous .pkg file and a signing credentials file.

### roku create-signing-credentials
Creates a signing credentials file and a dummy package to be used for future package signing.
#### Required arguments:
- `-n` or `--name` - output package filename'
- `-o` or `--output` - path to where signing properties should be saved


### What is a signing credentials file?
A signing credentials file is a file in the following format:
```
{
    "dev_id":"aca142f48ff0178977d45f34311eb2e87641626e0",
    "password":"G+3xm/Nr7VR33iqzcXQSDQ=="
}
```

It is a simple way to store and reuse the signing properties required by Roku package generation. 


#### All commands supports passing the following parameters:

- `-d` or `--device` - sets the network address of the Roku device
- `-u` or `--user` - sets the user of the Roku device. defaults to `rokudev`
- `-w` or `--password` - sets the password of the Roku device

Also, device properties can also be passed by setting the following environment variables:
`ROKU_DEVICE_ADDRESS`, `ROKU_DEVICE_USERNAME` and `ROKU_DEVICE_PASSWORD`