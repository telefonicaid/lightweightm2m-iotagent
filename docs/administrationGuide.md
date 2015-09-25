OMA Lightweight M2M IoT Agent: Administration Guide
==================
# Index

* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Configuration](#configuration)
* [Packaging](#packaging)
* [Sanity checks](#sanity)
* [Diagnosis procedures](#diagnosis)

#  <a name="prerequisites"/>  Prerequisites
The IOT Agent requires Node.js 0.10.x to work and uses NPM as its package manager. Most Linux distributions offer packages to install it. For other OS, you can find instructions to install Node.js [here](https://nodejs.org/). 

NOTE: the current version of Node.js, 0.12.x has not been tested with the Agent, so we suggest to download and use the previous version (that process can be eased with utilities as `n` or  `nvm`).


#  <a name="installation"/> Installation

## Cloning the Github repository
Once the repository is cloned, from the root folder of the project execute:
```
npm install
```
This will download the dependencies for the project, and let it ready to the execution.

## Using the RPM 
To see how to generate the RPM, follow the instructions in [Packaging](#rpm).

To install the RPM, use the YUM tool:
```
yum localinstall --nogpg <rpm-file>
```

## Using Docker
There are automatic builds of the development version of the IOTAgent published in Docker hub. In order to install using the docker version, just execute the following:
```
docker run --link orion:orion fiwareiotplatform/lighteweightm2m-iotagent
```
As you can see, the Lightweight M2M (as any other IOTA) requires a Context Broker to work. In order to link it, just use the option `--link` as shown in the example.

# <a name="usage"/> Usage
## Github installation
In order to execute the IOTAgent, just issue the following command from the root folder of the cloned project:
```
bin/lwm2mAgent.js [config file]
```
The optional name of a config file is optional and described in the following section.

## RPM installation
The RPM installs a linux service that can be managed with the typical instructions:
```
service iotagent-lwm2m start

service iotagent-lwm2m status

service iotagent-lwm2m stop
```

In this mode, the log file is written in `/var/log/iotagent-lwm2m/iotagent-lwm2m.log`.

# <a name="configuration"/> Configuration
There are two ways to provide the IOT Agent with a configuration set: passing the name of a config file (related to the root folder of the project) or customize the example `config.js` in the root. 

The configuration file is divided in two sections: one standard section for the NGSI North bound `ngsi`, and another one for the specific Lightweight M2M South bound, `lwm2m`. The former follows the same format described for the Node.js IOT Agent Framework, described [here](https://github.com/telefonicaid/iotagent-node-lib#global-configuration). The latter configures the Lightweight M2M library used for communicating with the devices, as described [here](https://github.com/telefonicaid/lwm2m-node-lib#-configuration) (`server` section).

These are the specific LWM2M parameters that can be configured for the agent:
* **logLevel**: level of logs for the IOTAgent specific information. E.g.: 'DEBUG'.
* **port**: UDP port where the IOTAgent will be listening. E.g.: 60001.
* **defaultType**: for the cases when no type can be assigned to a device (no preprovision or path asignation of type), this type will be assigned by default. E.g.: 'Device'
* **types**: for IOTAgents with multiple southbound paths, this attribute maps attribute types (defined either in the configuration file or by using the Device Configuration API) to southbound interfaces. E.g.:
```
        {
            name: 'Light',
            url: '/light'
        },
        {
            name: 'Pressure',
            url: '/pres'
        },
        {
            name: 'Arduino',
            url: '/arduino'
        }
```
# <a name="packaging"/> Packaging
The only package type allowed is RPM. In order to execute the packaging scripts, the RPM Build Tools must be available
in the system.

From the root folder of the project, create the RPM with the following commands:
```
cd rpm
./create-rpm.sh <release-number> <version-number>
```
Where `<version-number>` is the version (x.y.z) you want the package to have and `<release-number>` is an increasing
number dependent un previous installations. 

# <a name="sanity"/> Sanity checks

# <a name="diagnosis"/> Diagnosis procedures
