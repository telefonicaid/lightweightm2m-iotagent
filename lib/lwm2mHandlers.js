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

var iotAgentLib = require('fiware-iotagent-lib'),
    lwm2mLib = require('iotagent-lwm2m-lib').server,
    omaRegistry = require('../omaRegistryMap.json'),
    lwm2mUtils = require('./lwm2mUtils'),
    logger = require('logops'),
    async = require('async'),
    apply = async.apply,
    errors = require('./errors'),
    _ = require('underscore'),
    config,
    context = {
        op: 'IOTAgent.Global'
    };


/**
 * Handle incoming information from an active attribute of the LWM2M device in the southbound.
 *
 * @param {Object} registeredDevice         LWM2M Device sending the information.
 * @param {String} name                     Name of the attribute to update.
 * @param {String} type                     Type of the attribute to update.
 * @param {String} value                    New value for the attribute.
 */
function activeDataHandler(registeredDevice, name, type, value) {
    var attributes = [
        {
            name: name,
            type: type,
            value: value
        }
    ];

    logger.debug(context, 'Handling data from device [%s]', registeredDevice.id);

    iotAgentLib.update(
        registeredDevice.name,
        registeredDevice.type,
        attributes,
        registeredDevice,
        function handleUpdateEntity(error) {
            if (error) {
                logger.error(context, 'Unknown error connecting with the Context Broker: ' + error);
            } else {
                logger.debug(context, 'Data handled successfully');
            }
        }
    );
}

/**
 * Given a registered device and a text payload indicating a list of the OMA Objects supported by a client, creates an
 * observer for each active resource associated with that kind of device.
 *
 * @param {String} payload              Text representation of the list of objects supported by the client.
 * @param {Object} registeredDevice     Object representing the LWM2M device data.
 */
function observeActiveAttributes(payload, registeredDevice, callback) {
    var objects = lwm2mUtils.parseObjectUriList(payload),
        activeAttributes = [],
        observationList = [];

    if (registeredDevice.active) {
        activeAttributes = registeredDevice.active;
    } else if (config.ngsi.types[registeredDevice.type]) {
        activeAttributes = config.ngsi.types[registeredDevice.type].active;
    }

    for (var i = 0; i < activeAttributes.length; i++) {
        var lwm2mMapping = {};

        if (registeredDevice.internalAttributes &&
            registeredDevice.internalAttributes.lwm2mResourceMapping &&
            registeredDevice.internalAttributes.lwm2mResourceMapping[activeAttributes[i].name]) {
            lwm2mMapping = registeredDevice.internalAttributes.lwm2mResourceMapping[activeAttributes[i].name];
        } else {
            lwm2mMapping = config
                .ngsi
                .types[registeredDevice.type]
                .lwm2mResourceMapping[activeAttributes[i].name];
        }

        if (lwm2mMapping) {
            var mappedUri = '/' + lwm2mMapping.objectType + '/' + lwm2mMapping.objectInstance;

            for (var j = 0; j < objects.length; j++) {
                if (mappedUri === objects[j]) {
                    observationList.push(apply(lwm2mLib.observe,
                        registeredDevice.internalId,
                        lwm2mMapping.objectType,
                        lwm2mMapping.objectInstance,
                        lwm2mMapping.objectResource,
                        apply(activeDataHandler,
                            registeredDevice,
                            activeAttributes[i].name,
                            activeAttributes[i].type)
                    ));
                }
            }
        }
    }

    async.series(observationList, function(error) {
        if (error) {
            logger.error('Could not complete the observer creation processes due to the following error: ' + error);
            callback(error);
        } else {
            callback(null);
        }
    });
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

    /**
     * Map the Lightweight M2M device information to the NGSI model that is used by the IoT Agent.
     *
     * @param {Object} device           Lightweight M2M device.
     */
    function mapConfig(device, callback) {
        var deviceInformation = {
            id: device.name,
            name: device.name + ':' + device.type,
            type: device.type,
            service: config.ngsi.types[device.type].service,
            subservice: config.ngsi.types[device.type].subservice,
            lazy: config.ngsi.types[device.type].lazy,
            active: config.ngsi.types[device.type].active,
            internalId: device.id
        };

        logger.debug(context, 'Mapping device found to NGSI register');

        if (config.ngsi.types[device.type].removeSuffix) {
            deviceInformation.id = device.name;
        }

        if (device.type) {
            callback(null, deviceInformation);
        } else {
            logger.error(context, 'Type not found for device. It won\'t be given a connection');
            callback('Type not found for device');
        }
    }

    /**
     * Parse the device registration payload and add to the model those attributes supported in the payload and
     * defined in th OMA Registry (but not in the type definition or the device provisioning). All the OMA attributes
     * are defined as Lazy attributes.
     *
     * @param {Object} deviceInformation        IoT Agent Device Object.
     */
    function addUnsupportedAttributes(deviceInformation, callback) {
        var objects = lwm2mUtils.parseObjectUriList(payload),
            mappings = _.values(config.ngsi.types[deviceInformation.type].lwm2mResourceMapping),
            newAttributes;

        function parse(value) {
            var components = value.match(/\/\d+/g);

            if (components.length < 2) {
                logger.error(context, 'Payload contained single ObjectTypes or invalid URI');

                return null;
            } else if (components) {
                return {
                    objectType: components[0].substring(1),
                    objectInstance: components[1].substring(1),
                    objectResource: components[2]
                };
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

        function toNgsi(previous, value) {
            if (omaRegistry[value.objectType]) {
                return previous.concat(omaRegistry[value.objectType].resources);
            } else {
                return previous;
            }
        }

        newAttributes = objects
            .map(parse)
            .filter(isNotSupported)
            .reduce(toNgsi, []);

        deviceInformation.lazy = deviceInformation.lazy.concat(newAttributes);

        callback(null, deviceInformation);
    }

    function addInternalId(ngsiDevice, lwm2mDevice, callback) {
        ngsiDevice.internalId = lwm2mDevice.id;

        callback(null, ngsiDevice);
    }

    iotAgentLib.getDevice(endpoint, function(error, device) {
        if (error && error.name && error.name === 'ENTITY_NOT_FOUND') {
            logger.debug(context, 'Device register not found. Creating new device.');
            async.waterfall([
                async.apply(lwm2mLib.getRegistry().getByName, endpoint),
                mapConfig,
                addUnsupportedAttributes,
                iotAgentLib.register,
                apply(observeActiveAttributes, payload)
            ], callback);
        } else if (error) {
            logger.debug(context, 'An error was encountered registering device.');
            callback(error);
        } else if (device) {
            logger.debug(context, 'Preregistered device found.');
            async.waterfall([
                async.apply(lwm2mLib.getRegistry().getByName, endpoint),
                async.apply(addInternalId, device),
                iotAgentLib.updateRegister,
                apply(observeActiveAttributes, payload)
            ], callback);
        } else {
            logger.debug(context, 'Impossible to find a proper way to deal with the registration');
            callback(
                new errors.UnknownInternalError('Impossible to find a proper way of dealing with the registration'));
        }
    });
}

/**
 * Handles an unregistration request coming from a LWM2M device.
 *
 * @param {Object} device       LWM2M Device object.
 */
function unregistrationHandler(device, callback) {
    logger.debug(context, 'Handling unregistration of the device');

    iotAgentLib.unregister(device.name, callback);
}

/**
 * Handles an update registration request coming from a LWM2M Device.
 *
 * @param {Object} device       LWM2M Device object.
 * @param {String} payload      New payload indicating the supported objects.
 */
function updateRegistration(device, payload, callback) {
    logger.debug(context, 'Handling update registration of the device');

    function removePreviousSubscriptions(callback) {
        lwm2mLib.listObservers(function observersHandler(error, observersList) {
            if (error) {
                callback(error);
            } else {
                var cancellations = [];
                for (var i = 0; i < observersList.length; i++) {
                    if (observersList[i].deviceId.toString() === device.id.toString()) {
                        var fields = lwm2mLib.parseObserverId(observersList[i].id);

                        cancellations.push(apply(lwm2mLib.cancelObserver,
                            fields.deviceId,
                            fields.objectType,
                            fields.objectId,
                            fields.resourceId
                        ));
                    }
                }

                async.series(cancellations, function(error, results) {
                    callback(error);
                });
            }
        });
    }

    async.waterfall([
        removePreviousSubscriptions,
        apply(iotAgentLib.getDevice, device.name),
        apply(observeActiveAttributes, payload)
    ], callback);
}

/**
 * Initializes the handlers module, loading a new configuration.
 *
 * @param {Object} newConfig        New Configuration object.
 */
function init(newConfig) {
    config = newConfig;
}

exports.init = init;
exports.updateRegistration = updateRegistration;
exports.unregistration = unregistrationHandler;
exports.registration = registrationHandler;
