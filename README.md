# FIWARE IoT Agent for OMA LightWeight Machine2Machine

[![FIWARE IoT Agents](https://nexus.lab.fiware.org/static/badges/chapters/iot-agents.svg)](https://www.fiware.org/developers/catalogue/)
[![License: APGL](https://img.shields.io/github/license/telefonicaid/lightweightm2m-iotagent.svg)](https://opensource.org/licenses/AGPL-3.0)
[![Docker badge](https://img.shields.io/docker/pulls/fiware/lightweightm2m-iotagent.svg)](https://hub.docker.com/r/fiware/lightweightm2m-iotagent/)
[![Support badge](https://nexus.lab.fiware.org/repository/raw/public/badges/stackoverflow/iot-agents.svg)](https://stackoverflow.com/questions/tagged/fiware+iot)
<br>
[![Documentation badge](https://img.shields.io/readthedocs/fiware-iotagent-lwm2m.svg)](http://fiware-iotagent-lwm2m.readthedocs.org/en/latest/?badge=latest)
![Status](https://nexus.lab.fiware.org/static/badges/statuses/iot-lightweightm2m.svg)

This Internet of Things Agent is designed to be a bridge between the
[OMA](https://www.omaspecworks.org/)
[Lightweight M2M](https://www.omaspecworks.org/what-is-oma-specworks/iot/lightweight-m2m-lwm2m/)
protocol and the
[NGSI](https://swagger.lab.fiware.org/?url=https://raw.githubusercontent.com/Fiware/specifications/master/OpenAPI/ngsiv2/ngsiv2-openapi.json)
interface of a context broker

It is based on the
[FIWARE IoT Agent Node.js Library](https://github.com/telefonicaid/iotagent-node-lib).
Further general information about the FIWARE IoT Agents framework, its
architecture and the common interaction model can be found in this repository.

This project is part of [FIWARE](https://www.fiware.org/). For more information
check the FIWARE Catalogue entry for the
[IoT Agents](https://github.com/Fiware/catalogue/tree/master/iot-agents).

 | :books: [Documentation](https://fiware-iotagent-lwm2m.rtfd.io) | :mortar_board: [Academy](https://fiware-academy.readthedocs.io/en/latest/iot-agents/idas)  | :whale: [Docker Hub](https://hub.docker.com/r/fiware/lightweightm2m-iotagent/) |
|---|---|---|

## Contents

-   [Background](#background)
-   [Install](#install)
-   [Usage](#usage)
-   [API](#api)
-   [License](#license)

## Background

### Description

An Internet of Things Agent is a component that lets groups of devices send
their data to and be managed from a FIWARE NGSI Context Broker using their own
native protocols. This project provides the IoT Agent for the Lightweight M2M
protocol, i.e. the bridge between OMA Lightweight M2M enabled devices and an
NGSI Context Broker.

For more information on what an IoT Agent is or how it should work, please check
the documentation on the
[IoT Agent Node.js Library](https://iotagent-node-lib.rtfd.io/).

For more information on
[OMA Lightweight M2M](http://openmobilealliance.org/about-oma/work-program/m2m-enablers/)
you can check the
[Node.js OMA Lightweight M2M library](https://github.com/telefonicaid/lwm2m-node-lib)
we are using.

If you just want to start using the agent, jump to the
[Quick Start Guide](docs/userGuide.md#getting-started).

You will find some more general considerations about the LWM2M Mapping we are
using in the following subsections.

### Type configuration

In order to assign the proper configuration for each type of device, a mechanism
to assign types to new arriving devices should be used. This mechanism is based
on Prefixes for the registrarion URL. For each type configured in the `lwm2m`
configuration section in the `config.js` config file, a url prefix has to be
defined. Whenever a registration arrives to an url with that prefix, the device
will be assigned the corresponding type.

### Mappings

One of the features to provide through the IoT Agent is the mapping between the
protocol specific names of the South Port traffic to the application-specific
names in the North Port. In the case of Lightweight M2M, this means to map two
things:

-   OMA Registry objects and resources from their URIs (e.g.: '') to their
    common names (e.g.: '').
-   Custom device objects to the names defined by the user.

In order to accomplish this task, the agent supports:

-   An aditional property `lwm2mResourceMapping` that lets the user configure
    names for to each of the particular resources exposed by a device Type
-   Two optional configuration file, `omaRegistry.json` containing the automatic
    mappings that will be applied in case there are no custom mappings.

Custom mappings defined by the user in the config.js file or by preprovisioning
devices take precedence over any other available mapping.

### OMA Registry mapping

The IoT Agent provides a mean to map Lightweight M2M objects supported by the
client without the need to map them in the type or prevoprovision information.
The mapping works as follows: whenever a device registration arrives to the IoT
Agent **if there is no configured mapping for any of the objects supported by
the decive** (that should appear in the registration payload), then **all the
resources supported by the object in the OMA Registry** are configured **as
passive resources** offered by the object.

The OMA Registry information is read from two files: `omaRegistry.json` and
`omaInverseRegistry.json`. This two files can be generated with the last
information in the OMA Registry with the command `bin/downloadOmaRegistry.js`.
Notice that the generated files **do not** have the same name than the original
ones (so the result can be double-checked before changing them). In order to use
the freshly downloaded ones, just remove the former and rename the latter.

### Preprovisioning

For individual provisioning of devices, LWM2M devices can be preprovisioned to
the server, sending all the required information to the IoT Agent Provisioning
API. Preprovisioned devices should target the standard '/rd' url instead of a
type url. The preprovision configuration will be identified by the Endpoint name
sent by the device.

### A note about security

IoT Agent security is still in development, so no Southbound or Northbound
security mechanisms are provided. The NGSI Context Broker can be secured with a
[PEP Proxy]() anyway, so the IoT Agent should be able to deal with token based
security. This mechanism is achieved with the use of Keystone Trust Tokens. For
more information on how to use them, please read the Security Section in
[Node IoT Agent Library](https://github.com/telefonicaid/iotagent-node-lib).

## Install

Information about how to install the OMA Lightweight M2M IoT Agent can be found
at the corresponding section of the
[Installation & Administration Guide](docs/administrationGuide.md).

A `Dockerfile` is also available for your use - further information can be found [here](docker/README.md)

## Usage

Information about how to use the IoT Agent can be found in the
[User & Programmers Manual](docs/userGuide.md).

The following features are listed as [deprecated](docs/deprecated.md)

## API

Apiary reference for the Configuration API can be found
[here](http://docs.telefonicaiotiotagents.apiary.io/#reference/configuration-api).
More information about IoT Agents and their APIs can be found in the IoT Agent
Library [documentation](https://iotagent-node-lib.rtfd.io/).

The latest OMA Lightweight M2M IoT Agent documentation is also available on [ReadtheDocs](https://fiware-iotagent-lwm2m.readthedocs.io/en/latest)

---

## License

The IoT Agent for Lightweight Machine 2 Machine is licensed under Affero General
Public License (GPL).

© 2019 Telefonica Investigación y Desarrollo, S.A.U
