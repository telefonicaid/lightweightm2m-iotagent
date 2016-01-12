/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of lightweightM2M-iotagent
 *
 * lightweightM2M-iotagent is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * lightweightM2M-iotagent is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with lightweightM2M-iotagent.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */
'use strict';

var iotAgentLib = require('iotagent-node-lib'),
    lwm2mLib = require('lwm2m-node-lib').server,
    omaRegistry = require('../../../omaRegistry.json'),
    commonLwm2m = require('./commonLwm2m'),
    lwm2mUtils = require('../../lwm2mUtils'),
    logger = require('logops'),
    async = require('async'),
    apply = async.apply,
    errors = require('../../errors'),
    _ = require('underscore'),
    commons = require('../../commons'),
    context = {
        op: 'IOTAgent.LWM2MHandlers'
    };

/**
 * Map the Lightweight M2M device information to the NGSI model that is used by the IoT Agent.
 *
 * @param {Object} device           Lightweight M2M device.
 */
function mapConfig(device, configuration, callback) {
    var deviceInformation;

    if (configuration) {
        logger.debug(context, 'Mapping device found to NGSI register');

        deviceInformation = {
            id: device.name,
            name: device.name + ':' + device.type,
            type: device.type,
            service: configuration.service,
            subservice: configuration.subservice,
            lazy: configuration.lazy,
            active: configuration.active,
            internalId: device.id
        };

        if (deviceInformation.removeSuffix) {
            deviceInformation.id = device.name;
        }

        callback(null, deviceInformation);
    } else {
        logger.error(context, 'Type not found for device. It won\'t be given a connection');
        callback(new errors.TypeNotFound());
    }
}

/**
 * Complete the configuration information using the configuration found in the given device configuration.
 *
 * @param {Object} ngsiDevice           NGSI representation of the device.
 * @param {Object} lwm2mDevice          LWM2M representation of the device.
 * @param {Object} configuration        Device configuration to mix
 */
function completeConfig(ngsiDevice, lwm2mDevice, configuration, callback) {
    ngsiDevice.internalId = lwm2mDevice.id;

    callback(null, ngsiDevice);
}

/**
 * Find the configuration corresponding to the given LWM2M Device. The configuration can be detected:
 * - Using the resource and API Key and de DB of configured groups.
 * - Using the device Type and the types table in the configuration.
 *
 * If in any of the cases a configuration is found, the configuration is returned along wth the LWM2M device.
 *
 * @param {Object} device               LWM2M Device connecting to the Agent.
 */
function findConfiguration(device, callback) {
    var cleanResource = device.path.substr(0, device.path.lastIndexOf('/')),
        finalConfiguration;

    // The APIKey for this call will be taken as the empty string, as there are no
    iotAgentLib.getConfiguration(cleanResource, '', function(error, configuration) {

        if (!error && configuration) {
            finalConfiguration = configuration;
        } else if (device.type && commons.getConfig().ngsi.types[device.type]) {
            finalConfiguration = commons.getConfig().ngsi.types[device.type];
        } else if (device.type) {
            finalConfiguration = device;
        }

        callback(null, device, finalConfiguration);
    });
}

/**
 * Parse the device registration payload and add to the model those attributes supported in the payload and
 * defined in th OMA Registry (but not in the type definition or the device provisioning). All the OMA attributes
 * are defined as Lazy attributes.
 *
 * @param {String} payload                  String payload containing the supported objects
 * @param {Object} configuration        Device configuration to mix
 * @param {Object} deviceInformation        IoT Agent Device Object.
 */
function addUnsupportedAttributes(payload, configuration, deviceInformation, callback) {
    var objects = lwm2mUtils.parseObjectUriList(payload),
        mappings,
        newAttributes;

    function parse(value) {
        var components = value.match(/\/\d+/g);

        if (components) {
            if (components.length < 2) {
                logger.error(context, 'Payload contained single ObjectTypes or invalid URI');

                return null;
            } else {
                return {
                    objectType: components[0].substring(1),
                    objectInstance: components[1].substring(1),
                    objectResource: components[2]
                };
            }
        } else {
            return null;
        }
    }

    function isNotSupported(value) {
        if (!value) {
            return false;
        }

        for (var i = 0; i < mappings.length; i++) {
            if (mappings[i].objectType === value.objectType) {
                return false;
            }
        }

        return true;
    }

    //Ezequiel: No añadir los atributos ya listados
    function isNotAlreadyMapped(value) {
      if (!value) {
        return false;
      }

      for (var k in configuration.lwm2mResourceMapping) {
        var m = configuration.lwm2mResourceMapping[k];
        if (m.objectType == value.objectType && m.objectInstance == value.objectInstance) {
          return false;
        }
      }

      return true;
    }

    function toNgsi(previous, value) {
        if (omaRegistry[value.objectType]) {
            if (omaRegistry[value.objectType].resources) {
                return previous.concat(omaRegistry[value.objectType].resources);
            } else {
                previous.push({
                    name: omaRegistry[value.objectType].name + '#' + value.objectInstance,
                    type: 'string'
                });

                return previous;
            }
        } else {
            return previous;
        }
    }

    if (configuration && configuration.lwm2mResourceMapping) {
        mappings = _.values(configuration.lwm2mResourceMapping);
    } else {
        mappings = [];
    }

    newAttributes = objects
        .map(parse)
        .filter(isNotSupported)
        .filter(isNotAlreadyMapped)
        .reduce(toNgsi, []);

    if (!deviceInformation.lazy) {
        deviceInformation.lazy = [];
    }

    deviceInformation.lazy = deviceInformation.lazy.concat(newAttributes);

    callback(null, deviceInformation);
}

/**
 * Registers a new Device in the IoT Agent, based on the information of the physical device and the configuration
 * found (whether it is a configuration provided by the Configuration API or by the config files).
 *
 * @param {Object} lwm2mDevice              Object representation of the information about the LWM2M Device
 * @param {Object} configuration            Configuration found for the registered device
 * @param {String} payload                  String payload containing the supported objects
 */
function createNewDevice(lwm2mDevice, configuration, payload, innerCallback) {
    async.waterfall([
        apply(mapConfig, lwm2mDevice, configuration),
        apply(addUnsupportedAttributes, payload, configuration),
        iotAgentLib.register,
        apply(commonLwm2m.observeActiveAttributes, payload)
    ], innerCallback);
}

/**
 * Updates the information of a preregistered device with the information provided by the device in registration
 * time.
 *
 * @param {Object} lwm2mDevice              Representation of the information about the LWM2M Device
 * @param {Object} ngsiDevice               Representation of the information about the preregistered Device
 * @param {Object} configuration            Configuration found for the registered device
 * @param {String} payload                  String payload containing the supported objects
 */
function updateRegisteredDevice(lwm2mDevice, ngsiDevice, configuration, payload, callback) {
    async.waterfall([
        apply(completeConfig, ngsiDevice, lwm2mDevice, configuration),
        apply(addUnsupportedAttributes, payload, configuration),
        iotAgentLib.updateRegister,
        apply(commonLwm2m.observeActiveAttributes, payload)
    ], callback);
}

/**
 * Handles a registration from the Lightweight M2M device. There are three scenarios:
 * - If the device has been registered before in the device registry, there is no registration needed.
 * - If the device is not registered, it should come with a URL, that can be used to guess its type. Once the type
 * has been detected, the rest of the information can be retrieved from the config file.
 *
 * @param {String} endpoint         Name of the endpoint that is registering against the server.
 * @param {Number} lifetime         Maximum lifetime of the registration in seconds.
 * @param {String} version          Version of Lightweight M2M this registration comply with.
 * @param {String} binding          Type of transport binding. The only currently accepted value is 'U'.
 * @param {String} payload          String representation of the list of supported objects.
 */
function registrationHandler(endpoint, lifetime, version, binding, payload, callback) {
    logger.debug(context, 'Handling registration of the device');

    function handleIncomingRegistrationRequest(error, lwm2mDevice, configuration) {
        if (error) {
            callback(error);
        } else {
            iotAgentLib.getDevice(endpoint, function(error, ngsiDevice) {
                if (error && error.name && error.name === 'DEVICE_NOT_FOUND') {
                    logger.debug(context, 'Device register not found. Creating new device.');
                    createNewDevice(lwm2mDevice, configuration, payload, callback);
                } else if (ngsiDevice) {
                    logger.debug(context, 'Preregistered device found.');
                    updateRegisteredDevice(lwm2mDevice, ngsiDevice, configuration, payload, callback);
                } else if (error) {
                    logger.debug(context, 'An error was encountered registering device.');
                    callback(error);
                } else {
                    logger.debug(context, 'Impossible to find a proper way to deal with the registration');
                    callback(new errors.UnknownInternalError(
                        'Impossible to find a proper way of dealing with the registration'));
                }
            });
        }
    }

    async.waterfall([
        async.apply(lwm2mLib.getRegistry().getByName, endpoint),
        findConfiguration
    ], handleIncomingRegistrationRequest);
}

exports.handler = registrationHandler;
