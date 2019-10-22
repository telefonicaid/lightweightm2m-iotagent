# OMA Lightweight M2M IoT Agent: Administration Guide

-   [Prerequisites](#prerequisites)
-   [Installation](#installation)
-   [Usage](#usage)
-   [Configuration](#configuration)
-   [Packaging](#packaging)
-   [Sanity checks](#sanity-checks)
-   [Diagnosis procedures](#diagnosis-procedures)
-   [High performance configuration usage](#high-performance-configuration-usage)

## Prerequisites

The IoT Agent requires Node.js 0.10.x to work and uses npm as its package manager. Most Linux distributions offer
packages to install it. For other OS, you can find instructions to install Node.js [here](https://nodejs.org/).

NOTE: the current version of Node.js, 0.12.x has not been tested with the Agent, so we suggest to download and use the
previous version (that process can be eased with utilities as `n` or `nvm`).

## Installation

### Cloning the GitHub repository

Once the repository is cloned, from the root folder of the project execute:

```bash
npm install
```

This will download the dependencies for the project, and let it ready to the execution.

### Using the RPM

To see how to generate the RPM, follow the instructions in [Packaging](#packaging).

To install the RPM, use the YUM tool:

```bash
yum localinstall --nogpg <rpm-file>
```

### Using Docker

There are automatic builds of the development version of the IoT Agent published in Docker hub. In order to install
using the docker version, just execute the following:

```bash
docker run --link orion:orion telefonicaiot/lightweightm2m-iotagent
```

As you can see, the Lightweight M2M (as any other IoT Agent) requires a Context Broker to work. In order to link it,
just use the option `--link` as shown in the example.

## Usage

### GitHub installation

In order to execute the IoT Agent, just issue the following command from the root folder of the cloned project:

```bash
bin/lwm2mAgent.js [config file]
```

The optional name of a config file is optional and described in the following section.

### RPM installation

The RPM installs a linux service that can be managed with the typical instructions:

```bash
service iotagent-lwm2m start

service iotagent-lwm2m status

service iotagent-lwm2m stop
```

In this mode, the log file is written in `/var/log/iotagent-lwm2m/iotagent-lwm2m.log`.

## Configuration

There are two ways to provide the IoT Agent with a configuration set: passing the name of a config file (related to the
root folder of the project) or customise the example `config.js` in the root.

The configuration file is divided in two sections: one standard section for the NGSI traffic North of the IoT Agent
`ngsi`, and another one for the specific Lightweight M2M traffic South of the IoT Agent, `lwm2m`. The former follows the
same format described for the Node.js IoT Agent Framework, described
[here](https://github.com/telefonicaid/iotagent-node-lib#global-configuration).

The latter configures the Lightweight M2M library used for communicating with the devices, as described
[here](https://github.com/telefonicaid/lwm2m-node-lib#-configuration) (`server` section).

These are the specific LWM2M parameters that can be configured for the agent:

-   **logLevel**: level of logs for the IoTAgent specific information. E.g.: 'DEBUG'.
-   **port**: UDP port where the IoT Agent will be listening. E.g.: 60001.
-   **delayedObservationTimeout**: When a LWM2M client has active attributes, the IoT Agent sends an observe instruction
    for each one, just after the client registers. This may cause an error when the client takes too long to start
    listening, as the observe requests may not reach its destiny. This timeout (ms) is used to give the client the
    opportunity to create the listener before the server sends the requests.
-   **defaultType**: for the cases when no type can be assigned to a device (no pre-provision or path assignation of
    type), this type will be assigned by default. E.g.: 'Device'
-   **types**: for IoT Agents with multiple southbound paths, this attribute maps attribute types (defined either in the
    configuration file or by using the Device Configuration API) to southbound interfaces. E.g.:

    ```javascript
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

## Packaging

The only package type allowed is RPM. In order to execute the packaging scripts, the RPM Build Tools must be available
in the system.

From the root folder of the project, create the RPM with the following commands:

```bash
cd rpm
./create-rpm.sh <release-number> <version-number>
```

Where `<version-number>` is the version (x.y.z) you want the package to have and `<release-number>` is an increasing
number dependent on previous installations.

## Sanity checks

The Sanity Check Procedures are the steps that a System Administrator will take to verify that an installation is ready
to be tested. This is therefore a preliminary set of tests to ensure that obvious or basic malfunctioning is fixed
before proceeding to unit tests, integration tests and user validation

### Checking the administrative interface is up

The first procedure that can be executed to check if the IoTAgent is running is to get the version from the
administrative interface. A curl command can be used to do so:

```bash
curl -v http://<server_ip>:4041/iot/about
```

The result of this execution must be a 200 OK return code along with the version of the IoT Agent library being
executed:

```text
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 46
ETag: W/"2e-d494dc75"
Date: Fri, 25 Sep 2015 08:14:45 GMT
Connection: keep-alive

{"version":"0.8.1","port":4041,"baseRoot":"/"}
```

### List of running processes

The Agent runs a single node.js process, executing the `bin/lwm2mAgent.js` script. Here is an example of the running
process.

```text
root       732 31786  8 10:14 pts/0    00:00:00 node bin/lwm2mAgent.js
```

If the process is running as a service, the PID number can be found in the `/opt/iotagent-lwm2m/iotagent-lwm2m.pid`
file.

### Databases

The Lightweight M2M can work with in-memory databases (for testing purposes) or with MongoDB, depending on the selected
configuration. The host, port and database name are configured in the config file as well. Check the
[Configuration](configurationProvisioning.md) section for details. Be aware that the North Port and the South Port
interactions both make use of the DB, and that their configurations can differ.

### Network Interfaces Up & Open

Using `netstat` in a Linux machine, the ports can be checked up. The IoT Agent should be listening in two ports: the
administration and provisioning port (typically TCP 4041) and the Lightweight M2M port (typically 60001).

The administrative port can be checked with the following command:

```bash
netstat -ntpl | grep 4041
```

and the result should be a single line like the following:

```text
tcp        0      0 0.0.0.0:4041                0.0.0.0:*                   LISTEN      <PID>/node
```

where the `<PID>` corresponds to the PID of the IoT Agent.

The Lightweight M2M port can be checked with the following command:

```bash
netstat -nupl | grep 60001
```

and the expected result would be a line like the following:

```text
udp        0      0 0.0.0.0:60001               0.0.0.0:*                               589/node
```

where the `<PID>` corresponds to the PID of the IoT Agent.

### Checking the service is up

A quick way to check if the service is working is to use the `status` command of the service. Execute:

```bash
service iotagent-lwm2m status
```

This will tell you if the SO thinks the IoT Agent Service is up. Be aware that this is just a quick method based on PID
checking, that doesn't check the actual working Agent, just the existence of the process. Querying the administrative
interface is always a stronger check.

### End-to-end testing

In order to make a simple LWM2M Check, a LWM2M client should be installed. The best approach is to install the client of
the same library the IoT Agent uses, the [Node.js LWM2M Library](https://github.com/telefonicaid/lwm2m-node-lib). This
library contains a simple command-line Lightweight M2M Client that can be used to test simple scenarios. For examples on
how to perform these kind of tests, see the How-To's in the
[Getting Started section of the User Manual](userGuide.md#getting-started) that shows simple registrations and send
measure tests.

## Diagnosis procedures

Whenever a problem is risen in the IoT Agent, or if the Sanity Checks fail, the administrator should look at the log
files in order to check what kind of problem has happened. If the IoT Agent has been deployed using the RPMs, logs will
be located in the `/var/log/iotagent-lwm2m` folder. If the IoT Agent has been started from the command line, logs are
written to the stdout. Whenever you are trying to debug a log, change first the log level as explained in the
configuration section. Be aware that the North Port and South Port interactions of the IoT Agent have different log
levels, that can be set independently.

### Resource availability

To be filled soon by DevOps.

### Remote Service Access

Check the [User Manual](userGuide.md) for more information on the exposed APIs.

### Resource consumption

To be filled soon by DevOps.

### I/O Flows

The Lightweight M2M IoT Agent follows the standard I/O flows for agents shown in the Node.js IoT Agent library. The flow
is reproduced here, for clarity:

![General](https://raw.githubusercontent.com/telefonicaid/iotagent-node-lib/master/doc/img/ngsiInteractions.png "NGSI Interactions")

The interaction in the South Bound follows the flows defined by the
[OMA Lightweight M2M Specification](http://www.omaspecworks.org/about-oma/work-program/m2m-enablers/).

## High performance configuration usage

Node.js is single‑threaded and uses non-blocking I/O, allowing it to scale up to tens of thousands of concurrent
operations. Nevertheless, Node.js has a few weak points and vulnerabilities that can make Node.js‑based systems to offer
under-performance behaviour, specially when a Node.js web application experiences rapid traffic growth.

Additionally, It is important to know the place in which the node.js server is running, because it has limitations.
There are two types of limits on the host: hardware and software. Hardware limits can be easy to spot. Your application
might be consuming all of the memory and needing to consume disk to continue working. Adding more memory by upgrading
your host, whether physical or virtual, seems to be the right choice.

Moreover, Node.js applications have also a software memory limit (imposed by V8), therefore we cannot forget about these
limitations when we execute a service. In this case of 64-bit environment, your application would be running by default
at a 1 GB V8 limit. If your application is running in high traffic scenarios, you will need a higher limit. The same is
applied to other parameters.

It means that we need to make some changes in the execution of node.js and in the configuration of the system:

-   **Node.js flags**

    -   **--use-idle-notification**

        Turns of the use idle notification to reduce memory footprint.

    -   **--expose-gc**

        Use the expose-gc command to enable manual control of the garbage collector from the own node.js server code. In
        case of the IoTAgent, it is not implemented because it is needed to implement the calls to the garbage collector
        inside the ser server, nevertheless the recommended value is every 30 seconds.

    -   **--max-old-space-size=xxxx**

        In that case, we want to increase the limit for heap memory of each V8 node process in order to use max capacity
        that it is possible instead of the 1,4Gb default on 64-bit machines (512Mb on a 32-bit machine). The
        recommendation is at least to use half of the total memory of the physical or virtual instance.

-   **User software limits**

    Linux kernel provides some configuration about system related limits and maximums. In a distributed environment with
    multiple users, usually you need to take into control the resources that are available for each of the users.
    Nevertheless, when the case is that you have only one available user but this one request a lot of resources due to
    a high performance application the default limits are not proper configured and need to be changed to resolve the
    high performance requirements. These are like maximum file handler count, maximum file locks, maximum process count
    etc.

    You can see the limits of your system executing the command:

    ```bash
    ulimit -a
    ```

    You can define the corresponding limits inside the file limits.conf. This description of the configuration file
    syntax applies to the `/etc/security/limits.conf` file and \*.conf files in the `/etc/security/limits.d` directory.
    You can get more information about the limits.conf in the
    [limits.con - linux man pages](http://man7.org/linux/man-pages/man5/limits.conf.5.html). The recommended values to
    be changes are the following:

    -   **core**

        Limits of the core file size in KB, we recommend to change to `unlimited` both hard and soft types.

            * soft core unlimited
            * hard core unlimited

    -   **data**

        Maximum data size in KB, we recommend to change to `unlimited` both hard and soft types.

            * soft data unlimited
            * hard data unlimited

    -   **fsize**

        Maximum filesize in KB, we recommend to change to `unlimited` both hard and soft types.

            * soft fsize unlimited
            * hard fsize unlimited

    -   **memlock**

        Maximum locked-in-memory address space in KB, we recommend to change to `unlimited` both hard and soft types.

            * memlock unlimited
            * memlock unlimited

    -   **nofile**

        Maximum number of open file descriptors, we recommend to change to `65535` both hard and soft types.

            * soft nofile 65535
            * hard nofile 65535

    -   **rss**

        Maximum resident set size in KB (ignored in Linux 2.4.30 and higher), we recommend to change to `unlimited` both
        hard and soft types.

            * soft rss unlimited
            * hard rss unlimited

    -   **stack**

        Maximum stack size in KB, we recommend to change to `unlimited` both hard and soft types.

            * soft stack unlimited
            * hard stack unlimited

    -   **nproc**

        Maximum number of processes, we recommend to change to `unlimited` both hard and soft types.

            * soft nproc unlimited
            * hard nproc unlimited

    You can take a look to the [limits.conf](limits.conf) file provided in this folder with all the values provided.

-   **Configure kernel parameters**

    sysctl is used to modify kernel parameters at runtime. We plan to modify the corresponding `/etc/sysctl.conf` file.
    You can get more information in the corresponding man pages of
    [sysctl](http://man7.org/linux/man-pages/man8/sysctl.8.html) and
    [sysctl.conf](http://man7.org/linux/man-pages/man5/sysctl.conf.5.html). You can search all the kernel parameters by
    using the command `sysctl -a`

    -   **fs.file-max**

        The maximum file handles that can be allocated, the recommended value is `1000000`.

            fs.file-max = 1000000

    -   **fs.nr_open**

        Max amount of file handles that can be opened, the recommended value is `1000000`.

            fs.nr_open = 1000000

    -   **net.netfilter.nf_conntrack_max**

        Size of connection tracking table. Default value is nf_conntrack_buckets value \* 4.

            net.nf_conntrack_max = 1048576

    For more details about any other kernel parameters, take a look to the example [sysctl.conf](sysctl.conf) file.
