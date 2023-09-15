# FIWARE IoT Agent for OMA LightWeight Machine2Machine

[![FIWARE IoT Agents](https://nexus.lab.fiware.org/static/badges/chapters/iot-agents.svg)](https://www.fiware.org/developers/catalogue/)
[![License: APGL](https://img.shields.io/github/license/telefonicaid/lightweightm2m-iotagent.svg)](https://opensource.org/licenses/AGPL-3.0)
[![Docker badge](https://img.shields.io/badge/docker-telefonicaiot%2Flightweightm2m--iotagent-blue?logo=docker)](https://hub.docker.com/r/telefonicaiot/lightweightm2m-iotagent)
[![Support badge](https://img.shields.io/badge/tag-fiware+iot-orange.svg?logo=stackoverflow)](https://stackoverflow.com/questions/tagged/fiware+iot)
<br>
[![Documentation badge](https://img.shields.io/readthedocs/fiware-iotagent-lwm2m.svg)](http://fiware-iotagent-lwm2m.readthedocs.io/en/latest/?badge=latest)
[![CI](https://github.com/telefonicaid/lightweightm2m-iotagent/workflows/CI/badge.svg)](https://github.com/telefonicaid/lightweightm2m-iotagent/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/telefonicaid/lightweightm2m-iotagent/badge.svg?branch=master)](https://coveralls.io/github/telefonicaid/lightweightm2m-iotagent?branch=master)
![Status](https://nexus.lab.fiware.org/static/badges/statuses/iot-lightweightm2m.svg)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/4701/badge)](https://bestpractices.coreinfrastructure.org/projects/4701)

This Internet of Things Agent is designed to be a bridge between the [OMA](https://www.omaspecworks.org/)
[Lightweight M2M](https://www.omaspecworks.org/what-is-oma-specworks/iot/lightweight-m2m-lwm2m/) protocol and the
[NGSI](https://swagger.lab.fiware.org/?url=https://raw.githubusercontent.com/Fiware/specifications/master/OpenAPI/ngsiv2/ngsiv2-openapi.json)
interface of a context broker

It is based on the [FIWARE IoT Agent Node.js Library](https://github.com/telefonicaid/iotagent-node-lib). Further
general information about the FIWARE IoT Agents framework, its architecture and the common interaction model can be
found in this repository.

This project is part of [FIWARE](https://www.fiware.org/). For more information check the FIWARE Catalogue entry for the
[IoT Agents](https://github.com/Fiware/catalogue/tree/master/iot-agents).

| :books: [Documentation](https://fiware-iotagent-lwm2m.readthedocs.io) | :mortar_board: [Academy](https://fiware-academy.readthedocs.io/en/latest/iot-agents/idas) | <img style="height:1em" src="https://quay.io/static/img/quay_favicon.png"/> [quay.io](https://quay.io/repository/fiware/lightweightm2m-iotagent)| :dart: [Roadmap](https://github.com/telefonicaid/lightweightm2m-iotagent/blob/master/docs/roadmap.md) |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |


## Contents

-   [Background](#background)
-   [Install](#install)
-   [Usage](#usage)
-   [API](#api)
-   [Contributing](#contributing)
-   [Testing](#testing)
-   [Roadmap](#roadmap)
-   [License](#license)

## Background

### Description

An Internet of Things Agent is a component that lets groups of devices send their data to and be managed from a FIWARE
NGSI Context Broker using their own native protocols. This project provides the IoT Agent for the Lightweight M2M
protocol, i.e. the bridge between OMA Lightweight M2M enabled devices and an NGSI Context Broker.

For more information on what an IoT Agent is or how it should work, please check the documentation on the
[IoT Agent Node.js Library](https://iotagent-node-lib.readthedocs.io/).

For more information on [OMA Lightweight M2M](https://omaspecworks.org/what-is-oma-specworks/iot/) you can check the
[Node.js OMA Lightweight M2M library](https://github.com/telefonicaid/lwm2m-node-lib) we are using.

If you just want to start using the agent, jump to the [Quick Start Guide](docs/userGuide.md#getting-started).

You will find some more general considerations about the LWM2M Mapping we are using in the following subsections.

### Type configuration

In order to assign the proper configuration for each type of device, a mechanism to assign types to new arriving devices
should be used. This mechanism is based on Prefixes for the registrarion URL. For each type configured in the `lwm2m`
configuration section in the `config.js` config file, a URL prefix has to be defined. Whenever a registration arrives to
a URL with that prefix, the device will be assigned the corresponding type.

### Mappings

One of the features to provide through the IoT Agent is the mapping between the protocol specific names of the South
Port traffic to the application-specific names in the North Port. In the case of Lightweight M2M, this means to map two
things:

-   OMA Registry objects and resources from their URIs (e.g.: '') to their common names (e.g.: '').
-   Custom device objects to the names defined by the user.

In order to accomplish this task, the agent supports:

-   An aditional property `lwm2mResourceMapping` that lets the user configure names for to each of the particular
    resources exposed by a device Type
-   Two optional configuration file, `omaRegistry.json` containing the automatic mappings that will be applied in case
    there are no custom mappings.

Custom mappings defined by the user in the config.js file or by preprovisioning devices take precedence over any other
available mapping.

### OMA Registry mapping

The IoT Agent provides a mean to map Lightweight M2M objects supported by the client without the need to map them in the
type or prevoprovision information. The mapping works as follows: whenever a device registration arrives to the IoT
Agent **if there is no configured mapping for any of the objects supported by the decive** (that should appear in the
registration payload), then **all the resources supported by the object in the OMA Registry** are configured **as
passive resources** offered by the object.

The OMA Registry information is read from two files: `omaRegistry.json` and `omaInverseRegistry.json`. This two files
can be generated with the last information in the OMA Registry with the command `bin/downloadOmaRegistry.js`. Notice
that the generated files **do not** have the same name than the original ones (so the result can be double-checked
before changing them). In order to use the freshly downloaded ones, just remove the former and rename the latter.

### Preprovisioning

For individual provisioning of devices, LWM2M devices can be preprovisioned to the server, sending all the required
information to the IoT Agent Provisioning API. Preprovisioned devices should target the standard '/rd' URL instead of a
type URL. The preprovision configuration will be identified by the Endpoint name sent by the device.

### A note about security

IoT Agent security is still in development, so no Southbound or Northbound security mechanisms are provided. The NGSI
Context Broker can be secured with a [PEP Proxy]() anyway, so the IoT Agent should be able to deal with token based
security. This mechanism is achieved with the use of Keystone Trust Tokens. For more information on how to use them,
please read the Security Section in [Node IoT Agent Library](https://github.com/telefonicaid/iotagent-node-lib).

## Install

Information about how to install the OMA Lightweight M2M IoT Agent can be found at the corresponding section of the
[Installation & Administration Guide](docs/administrationGuide.md).

A `Dockerfile` is also available for your use - further information can be found [here](docker/README.md)

## Usage

Information about how to use the IoT Agent can be found in the [User & Programmers Manual](docs/userGuide.md).

The following features are listed as [deprecated](docs/deprecated.md)

## API

Apiary reference for the Configuration API can be found
[here](https://telefonicaiotiotagents.docs.apiary.io/#reference/configuration-api). More information about IoT Agents
and their APIs can be found in the IoT Agent Library [documentation](https://iotagent-node-lib.readthedocs.io/).

The latest OMA Lightweight M2M IoT Agent documentation is also available on
[ReadtheDocs](https://fiware-iotagent-lwm2m.readthedocs.io/en/latest)

## Contributing

If you'd like to contribute, start by searching through the issues and pull requests to see whether someone else has 
raised a similar idea or question.

Before contributing, please check out [contribution guidelines](docs/contribution.md)

## Testing

[Mocha](https://mochajs.org/) Test Runner + [Should.js](https://shouldjs.github.io/) Assertion Library.
The test environment is preconfigured to run BDD testing style.
Module mocking during testing can be done with [proxyquire](https://github.com/thlorenz/proxyquire)
To run tests, type
```console
npm test
```

## Roadmap

The roadmap of this FIWARE GE is described [here](docs/roadmap.md)

## License

The IoT Agent for Lightweight Machine 2 Machine is licensed under
[Affero General Public License (GPL) version 3](./LICENSE).

© 2023 Telefonica Investigación y Desarrollo, S.A.U

<details>
<summary><strong>Further information on the use of the AGPL open source license</strong></summary>
  
### Are there any legal issues with AGPL 3.0? Is it safe for me to use?

There is absolutely no problem in using a product licensed under AGPL 3.0. Issues with GPL (or AGPL) licenses are mostly
related with the fact that different people assign different interpretations on the meaning of the term “derivate work”
used in these licenses. Due to this, some people believe that there is a risk in just _using_ software under GPL or AGPL
licenses (even without _modifying_ it).

For the avoidance of doubt, the owners of this software licensed under an AGPL-3.0 license wish to make a clarifying
public statement as follows:

> Please note that software derived as a result of modifying the source code of this software in order to fix a bug or
> incorporate enhancements is considered a derivative work of the product. Software that merely uses or aggregates (i.e.
> links to) an otherwise unmodified version of existing software is not considered a derivative work, and therefore it
> does not need to be released as under the same license, or even released as open source.

</details>
