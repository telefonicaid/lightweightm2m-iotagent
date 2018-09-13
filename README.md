OMA Lightweight M2M IoT Agent: Overview
==================

[![FIWARE IoT Agents](https://img.shields.io/badge/FIWARE-IoT_Agents-5dc0cf.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAVCAYAAAC33pUlAAAABHNCSVQICAgIfAhkiAAAA8NJREFUSEuVlUtIFlEUx+eO+j3Uz8wSLLJ3pBiBUljRu1WLCAKXbXpQEUFERSQF0aKVFAUVrSJalNXGgmphFEhQiZEIPQwKLbEUK7VvZrRvbr8zzjfNl4/swplz7rn/8z/33HtmRhn/MWzbXmloHVeG0a+VSmAXorXS+oehVD9+0zDN9mgk8n0sWtYnHo5tT9daH4BsM+THQC8naK02jCZ83/HlKaVSzBey1sm8BP9nnUpdjOfl/Qyzj5ust6cnO5FItJLoJqB6yJ4QuNcjVOohegpihshS4F6S7DTVVlNtFFxzNBa7kcaEwUGcbVnH8xOJD67WG9n1NILuKtOsQG9FngOc+lciic1iQ8uQGhJ1kVAKKXUs60RoQ5km93IfaREvuoFj7PZsy9rGXE9G/NhBsDOJ63Acp1J82eFU7OIVO1OxWGwpSU5hb0GqfMydMHYSdiMVnncNY5Vy3VbwRUEydvEaRxmAOSSqJMlJISTxS9YWTYLcg3B253xsPkc5lXk3XLlwrPLuDPKDqDIutzYaj3eweMkPeCCahO3+fEIF8SfLtg/5oI3Mh0ylKM4YRBaYzuBgPuRnBYD3mmhA1X5Aka8NKl4nNz7BaKTzSgsLCzWbvyo4eK9r15WwLKRAmmCXXDoA1kaG2F4jWFbgkxUnlcrB/xj5iHxFPiBN4JekY4nZ6ccOiQ87hgwhe+TOdogT1nfpgEDTvYAucIwHxBfNyhpGrR+F8x00WD33VCNTOr/Wd+9C51Ben7S0ZJUq3qZJ2OkZz+cL87ZfWuePlwRcHZjeUMxFwTrJZAJfSvyWZc1VgORTY8rBcubetdiOk+CO+jPOcCRTF+oZ0okUIyuQeSNL/lPrulg8flhmJHmE2gBpE9xrJNkwpN4rQIIyujGoELCQz8ggG38iGzjKkXufJ2Klun1iu65bnJub2yut3xbEK3UvsDEInCmvA6YjMeE1bCn8F9JBe1eAnS2JksmkIlEDfi8R46kkEkMWdqOv+AvS9rcp2bvk8OAESvgox7h4aWNMLd32jSMLvuwDAwORSE7Oe3ZRKrFwvYGrPOBJ2nZ20Op/mqKNzgraOTPt6Bnx5citUINIczX/jUw3xGL2+ia8KAvsvp0ePoL5hXkXO5YvQYSFAiqcJX8E/gyX8QUvv8eh9XUq3h7mE9tLJoNKqnhHXmCO+dtJ4ybSkH1jc9XRaHTMz1tATBe2UEkeAdKu/zWIkUbZxD+veLxEQhhUFmbnvOezsJrk+zmqMo6vIL2OXzPvQ8v7dgtpoQnkF/LP8Ruu9zXdJHg4igAAAABJRU5ErkJgggA=)](https://www.fiware.org/developers/catalogue/)
[![License: APGL](https://img.shields.io/github/license/telefonicaid/lightweightm2m-iotagent.svg)](https://opensource.org/licenses/AGPL-3.0)
[![Documentation badge](https://img.shields.io/readthedocs/fiware-iotagent-lwm2m.svg)](http://fiware-iotagent-lwm2m.readthedocs.org/en/latest/?badge=latest)
[![Docker badge](https://img.shields.io/docker/pulls/fiware/lightweightm2m-iotagent.svg)](https://hub.docker.com/r/fiware/lightweightm2m-iotagent/)
[![Support badge](https://img.shields.io/badge/tag-fiware+iot-orange.svg?logo=stackoverflow)](https://stackoverflow.com/questions/tagged/fiware+iot)

# Index

* [Overview](#overview)
* [Installation and Administration Guide](docs/administrationGuide.md)
  * [Sanity check procedures](docs/administrationGuide.md#sanity)
  * [Diagnosis Procedures](docs/administrationGuide.md#diagnosis)
* [User & Programmers Manual](docs/userGuide.md)

# Overview
## Description
An Internet of Things Agent is a component that lets groups of devices send their data to and be managed from a FIWARE NGSI Context Broker using their own native protocols. This project provides the IoT Agent for the Lightweight M2M protocol, i.e. the bridge between OMA Lightweight M2M enabled devices and a NGSI Context Broker.

For more information on what an IoT Agent is or how it should work, please check the documentation on the [Node IoT Agent Library](https://github.com/telefonicaid/iotagent-node-lib).

For more information on [OMA Lightweight M2M](http://openmobilealliance.org/about-oma/work-program/m2m-enablers/) you can check the [Node.js OMA Lightweight M2M library](https://github.com/telefonicaid/lwm2m-node-lib) we are using.

If you just want to start using the agent, jump to the [Quick Start Guide](docs/userGuide.md#getting-started).

You will find some  more general considerations about the LWM2M Mapping we are using in the following subsections.

## Type configuration
In order to assign the proper configuration for each type of device, a mechanism to assign types to new arriving devices should be used. This mechanism is based on Prefixes for the registrarion URL. For each type configured in the `lwm2m` configuration section in the `config.js` config file, a url prefix has to be defined. Whenever a registration arrives to an url with that prefix, the device will be assigned the corresponding type.

## Mappings
One of the features to provide through the IoT Agent is the mapping between the protocol specific names of the South Port traffic to the application-specific names in the North Port. In the case of Lightweight M2M, this means to map two things:
* OMA Registry objects and resources from their URIs (e.g.: '') to their common names (e.g.: '').
* Custom device objects to the names defined by the user.

In order to accomplish this task, the agent supports:
* An aditional property `lwm2mResourceMapping` that lets the user configure names for to each of the particular resources exposed by a device Type
* Two optional configuration file, `omaRegistry.json` containing the automatic mappings that will be applied in case there are no custom mappings.

Custom mappings defined by the user in the config.js file or by preprovisioning devices take precedence over any other available mapping.

### OMA Registry mapping
The IoT Agent provides a mean to map Lightweight M2M objects supported by the client without the need to map them in the type or prevoprovision information. The mapping works as follows: whenever a device registration arrives to the IoT Agent **if there is no configured mapping for any of the objects supported by the decive** (that should appear in the registration payload), then **all the resources supported by the object in the OMA Registry** are configured **as passive resources** offered by the object.

The OMA Registry information is read from two files: `omaRegistry.json` and `omaInverseRegistry.json`. This two files can be generated with the last information in the OMA Registry with the command `bin/downloadOmaRegistry.js`. Notice that the generated files **do not** have the same name than the original ones (so the result can be double-checked before changing them). In order to use the freshly downloaded ones, just remove the former and rename the latter.

## Preprovisioning
For individual provisioning of devices, LWM2M devices can be preprovisioned to the server, sending all the required information to the IoT Agent Provisioning API. Preprovisioned devices should target the standard '/rd' url instead of a type url. The preprovision configuration will be identified by the Endpoint name sent by the device.

## A note about security
IoT Agent security is still in development, so no Southbound or Northbound security mechanisms are provided. The NGSI Context Broker can be secured with a [PEP Proxy]() anyway, so the IoT Agent should be able to deal with token based security. This mechanism is achieved with the use of Keystone Trust Tokens. For more information on how to use them, please read the Security Section in [Node IoT Agent Library](https://github.com/telefonicaid/iotagent-node-lib).
