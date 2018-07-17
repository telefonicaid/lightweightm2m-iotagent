OMA Lightweight M2M IoT Agent: Administration Guide
==================
# Index

* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Configuration](#configuration)
* [Packaging](#packaging)
* [Sanity checks](#sanity)
* [Diagnosis procedures](#diagnosis)

# Prerequisites
The IOT Agent requires Node.js 0.10.x to work and uses NPM as its package manager. Most Linux distributions offer packages to install it. For other OS, you can find instructions to install Node.js [here](https://nodejs.org/).

NOTE: the current version of Node.js, 0.12.x has not been tested with the Agent, so we suggest to download and use the previous version (that process can be eased with utilities as `n` or  `nvm`).


# Installation

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
docker run --link orion:orion telefonicaiot/lightweightm2m-iotagent
```
As you can see, the Lightweight M2M (as any other IOTA) requires a Context Broker to work. In order to link it, just use the option `--link` as shown in the example.

# Usage
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

# Configuration
There are two ways to provide the IOT Agent with a configuration set: passing the name of a config file (related to the
root folder of the project) or customise the example `config.js` in the root.

The configuration file is divided in two sections: one standard section for the NGSI traffic North of the IoT Agent `ngsi`, and another
one for the specific Lightweight M2M traffic South of the IoT Agent, `lwm2m`. The former follows the same format described for the Node.js
IoT Agent Framework, described [here](https://github.com/telefonicaid/iotagent-node-lib#global-configuration).

The latter configures the Lightweight M2M library used for communicating with the devices, as described
[here](https://github.com/telefonicaid/lwm2m-node-lib#-configuration) (`server` section).

These are the specific LWM2M parameters that can be configured for the agent:

- **logLevel**: level of logs for the IOTAgent specific information. E.g.: 'DEBUG'.
- **port**: UDP port where the IOTAgent will be listening. E.g.: 60001.
- **delayedObservationTimeout**: When a LWM2M client has active attributes, the IOTA sends an observe instruction for
each one, just after the client registers. This may cause cause an error when the client takes too long to start listening,
as the observe requests may not reach its destiny. This timeout (ms) is used to give the client the opportunity to create
the listener before the server sends the requests.
- **defaultType**: for the cases when no type can be assigned to a device (no pre-provision or path assignation of type), this type will be assigned by default. E.g.: 'Device'
- **types**: for IOTAgents with multiple southbound paths, this attribute maps attribute types (defined either in the configuration file or by using the Device Configuration API) to southbound interfaces. E.g.:

```json
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

# Packaging
The only package type allowed is RPM. In order to execute the packaging scripts, the RPM Build Tools must be available
in the system.

From the root folder of the project, create the RPM with the following commands:
```
cd rpm
./create-rpm.sh <release-number> <version-number>
```
Where `<version-number>` is the version (x.y.z) you want the package to have and `<release-number>` is an increasing
number dependent on previous installations.

# Sanity checks
The Sanity Check Procedures are the steps that a System Administrator will take to verify that an installation is ready
to be tested. This is therefore a preliminary set of tests to ensure that obvious or basic malfunctioning is fixed
before proceeding to unit tests, integration tests and user validation

## Checking the administrative interface is up
The first procedure that can be executed to check if the IoTAgent is running is to get the version from the administrative
interface. A curl command can be used to do so:
```
curl -v http://<server_ip>:4041/iot/about
```
The result of this execution must be a 200 OK return code along with the version of the IoT Agent library being executed:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 46
ETag: W/"2e-d494dc75"
Date: Fri, 25 Sep 2015 08:14:45 GMT
Connection: keep-alive

{"version":"0.8.1","port":4041,"baseRoot":"/"}
```

## List of running processes
The Agent runs a single node.js process, executing the `bin/lwm2mAgent.js` script. Here is an example of the runnig process.

```
root       732 31786  8 10:14 pts/0    00:00:00 node bin/lwm2mAgent.js
```
If the process is running as a service, the PID number can be found in the `/opt/iotagent-lwm2m/iotagent-lwm2m.pid` file.

## Databases
The Lightweight M2M can work with in-memory databases (for testing purposes) or with MongoDB, depending on the selected
configuration. The host, port and database name are configured in the config file as well. Check the [Configuration](configuration)
section for details. Be aware that the North Port and the South Port interactions both make use of the DB, and that their configurations
can differ.

## Network Interfaces Up & Open
Using `netstat` in a Linux machine, the ports can be checked up. The IoT Agent should be listening in two ports: the
administration and provisioning port (tipically TCP 4041) and the Lightweight M2M port (typically 60001).

The administrative port can be checked with the following command:

```bash
netstat -ntpl | grep 4041
```

and the result should be a single line like the following:

```
tcp        0      0 0.0.0.0:4041                0.0.0.0:*                   LISTEN      <PID>/node
```
where the `<PID>` corresponds to the PID of the IoT Agent.


The Lightweight M2M port can be checked with the following command:

```bash
netstat -nupl | grep 60001
```

and the expected result would be a line like the following:

```
udp        0      0 0.0.0.0:60001               0.0.0.0:*                               589/node
```
where the `<PID>` corresponds to the PID of the IoT Agent.

## Checking the service is up
A quick way to check if the service is working is to use the `status` command of the service. Execute:
```
service iotagent-lwm2m status
```
This will tell you if the SO thinks the IOTA Service is up. Be aware that this is just a quick method based on PID checking,
that doesn't check the actual working Agent, just the existence of the process. Querying the administrative interface
is always a stronger check.

## End to end testing
In order to make a simple LWM2M Check, a LWM2M client should be installed. The best approach is to install the client
of the same library the IoT Agent uses, the [Node.js LWM2M Library](https://github.com/telefonicaid/lwm2m-node-lib).
This library contains a simple command line Lightweight M2M Client that can be used to test simple scenarios. For examples
on how to perform these kind of tests, see the How-To's in the [Getting Started section of the User Manual](userGuide.md#gettingstarted)
that shows simple registrations and send measure tests.

# Diagnosis procedures
Whenever a problem is risen in the IoT Agent, or if the Sanity Checks fail, the administrator should look at the log files
in order to check what kind of problema has happened. If the IoT Agent has been deployed using the RPMs, logs will be
located in the `/var/log/iotagent-lwm2m` folder. If the IoT Agent has been started from the command line, logs are
written to the stdout. Whenever you are trying to debug a log, change first the log level as explained in the configuration
section. Be aware that the North Port and South Port interactions of the IoT Agent have different log levels, that can be set independently.

## Resource availability
To be filled soon by DevOps.

## Remote Service Access
Check the [User Manual](userGuide.md) for more information on the exposed APIs.

## Resource consumption
To be filled soon by DevOps.

## I/O Flows
The Lightweight M2M IoT Agent follows the standard I/O flows for agents shown in the Node.js IoT Agent library. The flow
is reproduced here, for clarity:

![General ](https://raw.githubusercontent.com/telefonicaid/iotagent-node-lib/master/img/ngsiInteractions.png "NGSI Interactions")

The interaction in the South Bound follows the flows defined by the [OMA Lightweight M2M Specification](http://openmobilealliance.org/about-oma/work-program/m2m-enablers/).



