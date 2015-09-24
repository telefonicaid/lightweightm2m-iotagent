OMA Lightweight M2M IoT Agent: User and Development Guide
==================
# Index

* [Overview](#overview)
* [Getting Started](#gettingstarted)
* [Testing](#testing)
* [Development](#development)


# <a name="overview"/> Overview
The Lightweight M2M IoT Agent is a standard Fiware IoT Agent that implements the bridge of the OMA Lightweight M2M protocol
with the internal protocol for the FIWARE components (OMA NGSI). This IoT Agent is based in the public 
Node.js IoT Agent Library, where more information can be found about what the IoT Agents are and their different APIs. 

This project has, then, two APIs:
* The South Bound (LWM2M): information about it can be found in the [OMA Lightweight M2M](http://openmobilealliance.hs-sites.com/lightweight-m2m-specification-from-oma) official page.
* The North Bound Administration API: all the IoT Agents share a single Administration API, and it can be found in the [Node.JS IoT Agent Library Documentation](https://github.com/telefonicaid/iotagent-node-lib).
* The North Bound NGSI API: information about the northbound NGSI mapping can be obtained in the same Node.JS IOTA Library documentation.
 
You will find examples and more detailed information in the Getting Started howtos below.
 
# <a name="gettingstarted"/> Getting started
This document links a set of howtos oriented to give a quick step-by-step example on how to use the agent with 
different types of configurations. It's important to remark that those configuration options are not mutually exclusive:
an IoT Agent can have some device preprovisioned, some configuration groups defined and some static configurations also,
each for different types of devices.

Some the guides will share the use of a faked device type called `Robot` with the following characteristics:
* be part of the service `Factory` and subservice `/robots`.
* have an active attribute called `Battery` with type `number`, mapped to the LWM2M resource ID /7392/0/1.
* have a passive attribute called `Message` with type `string`, mapped to the LWM2M resource ID /7392/0/2.
* have a command attribute called `Position` with type `location`, mapped to the LWM2M resource ID /7392/0/3.

Some guides will show the use of the automatic OMA Registry mapping, using a faked device of type 'WeatherBaloon', 
with the following characteristics:
* be part of the service `Weather` and subservice `/baloons`.
* a passive attribute with resource ID /6/0/0 (Position: Longitude).
* a passive attribute with resource ID /6/0/1 (Position: Latitude).
* a passive attribute with resource ID /3303/0/0 (Temperature Sensor).
* an active attribute with resource ID /3312/0/0 (Power Control).

Each guide is presented with a brief explanation about its contents:

* [Device Provisioning Guide](deviceProvisioning.md): this guide shows how to configure and start an IoT Agent and use it
provisioning each device before sending its measures.
* [Configuration Provisioning Guide](configurationProvisioning.md): this guide shows how to configure a group of devices
for being autoprovisioned when they register in the agent.
* [Static Configuration Guide](staticConfiguration.md): this guide shows how to configure static routes that map incoming
devices to different statically configured types.
 
# <a name="testing"/> Testing
The IoT Agent comes with a test suite to check the main functionalities. In order to execute the test suite you must have the Grunt client installed. You can install it using the following command (you will need root permissions):
```
npm install -g grunt-cli
```
Once the client is installed and the dependencies are downloaded, you can execute the tests using:
```
grunt
```
This will execute the functional tests and the syntax checking as well.

NOTE: This are end to end tests, so they execute against real instances of the components (so make sure you have a real Context Broker configured in the config.js). Be aware that the tests clean the databases before and after they have been executed so DO NOT EXECUTE THIS TESTS ON PRODUCTION MACHINES.

# <a name="development"/> Development
## Project build
The project is managed using Grunt Task Runner.

For a list of available task, type
```bash
grunt --help
```

The following sections show the available options in detail.


## Testing
[Mocha](http://visionmedia.github.io/mocha/) Test Runner + [Chai](http://chaijs.com/) Assertion Library + [Sinon](http://sinonjs.org/) Spies, stubs.

The test environment is preconfigured to run [BDD](http://chaijs.com/api/bdd/) testing style with
`chai.expect` and `chai.should()` available globally while executing tests, as well as the [Sinon-Chai](http://chaijs.com/plugins/sinon-chai) plugin.

Module mocking during testing can be done with [proxyquire](https://github.com/thlorenz/proxyquire)

To run tests, type
```bash
grunt test
```

Tests reports can be used together with Jenkins to monitor project quality metrics by means of TAP or XUnit plugins.
To generate TAP report in `report/test/unit_tests.tap`, type
```bash
grunt test-report
```


## Coding guidelines
Uses provided .jshintrc and .gjslintrc flag files. The latter requires Python and its use can be disabled
while creating the project skeleton with grunt-init.
To check source code style, type
```bash
grunt lint
```

Checkstyle reports can be used together with Jenkins to monitor project quality metrics by means of Checkstyle
and Violations plugins.
To generate Checkstyle and JSLint reports under `report/lint/`, type
```bash
grunt lint-report
```


## Continuous testing
Support for continuous testing by modifying a src file or a test.
For continuous testing, type
```bash
grunt watch
```


## Source Code documentation
Generates HTML documentation under `site/doc/`. It can be used together with jenkins by means of DocLinks plugin.
For compiling source code documentation, type
```bash
grunt doc
```


## Code Coverage
Analizes the code coverage of your tests.

To generate an HTML coverage report under `site/coverage/` and to print out a summary, type
```bash
# Use git-bash on Windows
grunt coverage
```

To generate a Cobertura report in `report/coverage/cobertura-coverage.xml` that can be used together with Jenkins to
monitor project quality metrics by means of Cobertura plugin, type
```bash
# Use git-bash on Windows
grunt coverage-report
```

## Code complexity
Analizes code complexity using Plato and stores the report under `site/report/`. It can be used together with jenkins
by means of DocLinks plugin.
For complexity report, type
```bash
grunt complexity
```
