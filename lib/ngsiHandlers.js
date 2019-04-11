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
    logger = require('logops'),
    omaInverseRegistry = require('../omaInverseRegistry.json'),
    errors = require('./errors'),
    async = require('async'),
    apply = async.apply,
    config,
    context = {
        op: 'IOTAgent.NGSIHandlers'
    };

function extractOperations(device, attribute) {
    var operations;

    if (
        device.internalAttributes &&
        device.internalAttributes.lwm2mResourceMapping &&
        device.internalAttributes.lwm2mResourceMapping[attribute]
    ) {
        operations = device.internalAttributes.lwm2mResourceMapping[attribute].operations;
    }
    if (
        !operations &&
        config.ngsi.types[device.type] &&
        config.ngsi.types[device.type].lwm2mResourceMapping &&
        config.ngsi.types[device.type].lwm2mResourceMapping[attribute]
    ) {
        operations = config.ngsi.types[device.type].lwm2mResourceMapping[attribute].operations;
    }
    if (!operations && omaInverseRegistry[attribute]) {
        operations = omaInverseRegistry[attribute].operations;
    }
    if (!operations && attribute.indexOf('#') >= 0) {
        var attributeName = attribute.substr(0, attribute.indexOf('#')),
            //resourceNumber = attribute.substr(attribute.indexOf('#') + 1),
            temporalMapping = omaInverseRegistry[attributeName];

        if (temporalMapping) {
            operations = temporalMapping.operations;
        }
    }
    //TODO: By default all permisions?
    return operations || 'RWE';
}

function extractMapping(device, attribute) {
    var mapping;

    if (
        device.internalAttributes &&
        device.internalAttributes.lwm2mResourceMapping &&
        device.internalAttributes.lwm2mResourceMapping[attribute]
    ) {
        mapping = device.internalAttributes.lwm2mResourceMapping[attribute];
    } else if (
        config.ngsi.types[device.type] &&
        config.ngsi.types[device.type].lwm2mResourceMapping &&
        config.ngsi.types[device.type].lwm2mResourceMapping[attribute]
    ) {
        mapping = config.ngsi.types[device.type].lwm2mResourceMapping[attribute];
    } else if (omaInverseRegistry[attribute]) {
        mapping = omaInverseRegistry[attribute];
    } else if (attribute.indexOf('#') >= 0) {
        var attributeName = attribute.substr(0, attribute.indexOf('#')),
            resourceNumber = attribute.substr(attribute.indexOf('#') + 1),
            temporalMapping = omaInverseRegistry[attributeName];

        if (temporalMapping) {
            mapping = {
                objectResource: temporalMapping.objectResource,
                objectType: temporalMapping.objectType,
                objectInstance: resourceNumber
            };
        }
    }
    return mapping;
}

function sendLwm2mOperation(operation, ngsiDevice, lwm2mDevice, attributeName, attributeValue, callback) {
    var mapping = extractMapping(ngsiDevice, attributeName),
        parameters;

    if (!mapping) {
        callback(new errors.OmaMappingNotFound());
        return;
    }

    parameters = [lwm2mDevice.id, mapping.objectType, mapping.objectInstance, mapping.objectResource];

    if (attributeValue) {
        parameters.push(attributeValue);
    }

    parameters.push(callback);
    operation.apply(null, parameters);
}

function readAttribute(ngsiDevice, lwm2mDevice, attribute, innerCallback) {
    sendLwm2mOperation(lwm2mLib.read, ngsiDevice, lwm2mDevice, attribute, null, innerCallback);
}

function writeAttribute(ngsiDevice, lwm2mDevice, attribute, innerCallback) {
    sendLwm2mOperation(lwm2mLib.write, ngsiDevice, lwm2mDevice, attribute.name, attribute.value, innerCallback);
}

function executeAttribute(ngsiDevice, lwm2mDevice, attribute, innerCallback) {
    sendLwm2mOperation(lwm2mLib.execute, ngsiDevice, lwm2mDevice, attribute.name, attribute.value, innerCallback);
}

function selectRealName(extractedName, device, callback) {
    if (device) {
        logger.debug('Selecting ID from the stored device data');
        callback(null, device.id);
    } else {
        logger.debug('Deduced ID from the name');
        callback(null, extractedName);
    }
}

/**
 * Handle updates on a set of attributes for an entity.
 *
 * @param {String} id           Entity name of the selected entity in the query.
 * @param {String} type         Type of the entity.
 * @param {Array} attributes    List of attributes of the entity to be updated (including type and value).
 */
function ngsiUpdateHandler(id, type, service, subservice, attributes, callback) {
    var name = id.substring(0, id.indexOf(':'));

    logger.debug(context, 'Handling device data update from the north port for device [%s] of type [%s]', id, type);
    logger.debug(context, 'New attributes;\n%s', attributes);

    function updateDevice(ngsiDevice, lwm2mDevice, innerCallback) {
        async.map(attributes, async.apply(writeAttribute, ngsiDevice, lwm2mDevice), innerCallback);
    }

    if (!name) {
        name = id;
    }

    iotAgentLib.getDeviceByName(id, service, subservice, function(error, ngsiDevice) {
        if (error) {
            callback(error);
        } else {
            async.waterfall(
                [
                    async.apply(iotAgentLib.getDeviceByName, id, service, subservice),
                    async.apply(selectRealName, name),
                    lwm2mLib.getRegistry().getByName,
                    apply(updateDevice, ngsiDevice)
                ],
                callback
            );
        }
    });
}

function ngsiExecuteHandler(id, type, service, subservice, attributes, callback) {
    var name = id.substring(0, id.indexOf(':'));

    logger.debug(
        context,
        'Handling device command execution from the north port for device [%s] of type [%s]',
        id,
        type
    );
    logger.debug(context, 'Arguments: \n%s', attributes);

    function executeCommand(ngsiDevice, lwm2mDevice, innerCallback) {
        async.map(attributes, apply(executeAttribute, ngsiDevice, lwm2mDevice), innerCallback);
    }

    if (!name) {
        name = id;
    }

    function updateStatus(device, attributes, commandResult, statusCallback) {
        function updateAttributeStatus(attribute, innerCallback) {
            iotAgentLib.setCommandResult(
                device.name,
                device.type,
                device.apikey,
                attribute.name,
                commandResult,
                'EXECUTED',
                device,
                innerCallback
            );
        }

        async.map(attributes, updateAttributeStatus, statusCallback);
    }

    iotAgentLib.getDeviceByName(id, service, subservice, function(error, ngsiDevice) {
        if (error) {
            callback(error);
        } else {
            async.waterfall(
                [
                    apply(selectRealName, name, ngsiDevice),
                    lwm2mLib.getRegistry().getByName,
                    apply(executeCommand, ngsiDevice),
                    apply(updateStatus, ngsiDevice, attributes)
                ],
                callback
            );
        }
    });
}

/**
 * Handle queries coming to the IoT Agent via de Context Provider API (as a consequence of a query to a passive
 * attribute redirected by the Context Broker).
 *
 * @param {String} id           Entity name of the selected entity in the query.
 * @param {String} type         Type of the entity.
 * @param {Array} attributes    List of attributes to read.
 */
function ngsiQueryHandler(id, type, service, subservice, attributes, callback) {
    var name = id.substring(0, id.indexOf(':'));

    logger.debug(context, 'Handling device data query from the north port for device [%s] of type [%s]', id, type);
    logger.debug(context, 'New attributes;\n%s', attributes);

    function createContextElementNgsi1(device, attributeValues, callback) {
        var contextElement = {
            type: type,
            isPattern: false,
            id: id,
            attributes: []
        };

        for (var i = 0; i < attributes.length; i++) {
            var attributeType = 'string',
                lazySet = [];

            if (device.lazy) {
                lazySet = device.lazy;
            } else if (config.ngsi.types[type] && config.ngsi.types[type].lazy) {
                lazySet = config.ngsi.types[type].lazy;
            }

            for (var j = 0; j < lazySet.length; j++) {
                if (lazySet[j].name === attributes[i]) {
                    attributeType = lazySet[j].type;
                }
            }

            contextElement.attributes.push({
                name: attributes[i],
                type: attributeType,
                value: attributeValues[i]
            });
        }

        callback(null, contextElement);
    }

    function createContextElementNgsi2(device, attributeValues, callback) {
        var contextElement = {
            type: type,
            id: id
        };

        for (var i = 0; i < attributes.length; i++) {
            var attributeType = 'string',
                lazySet = [];

            if (device.lazy) {
                lazySet = device.lazy;
            } else if (config.ngsi.types[type] && config.ngsi.types[type].lazy) {
                lazySet = config.ngsi.types[type].lazy;
            }

            for (var j = 0; j < lazySet.length; j++) {
                if (lazySet[j].name === encodeURI(attributes[i])) {
                    attributeType = lazySet[j].type;
                }
            }

            contextElement[encodeURI(attributes[i])] = {
                type: attributeType,
                value: attributeValues[i]
            };
        }

        callback(null, contextElement);
    }

    function createContextElement(device, attributeValues, callback) {
        if (iotAgentLib.configModule.checkNgsi2()) {
            createContextElementNgsi2(device, attributeValues, callback);
        } else {
            createContextElementNgsi1(device, attributeValues, callback);
        }
    }

    function readAttributes(attributes, ngsiDevice, lwm2mDevice, innerCallback) {
        attributes = attributes.filter(function(attr) {
            return extractOperations(ngsiDevice, attr).indexOf('R') >= 0;
        });
        async.map(attributes, async.apply(readAttribute, ngsiDevice, lwm2mDevice), innerCallback);
    }

    if (!name) {
        name = id;
    }

    iotAgentLib.getDeviceByName(id, service, subservice, function(error, ngsiDevice) {
        if (error) {
            callback(error);
        } else {
            async.waterfall(
                [
                    async.apply(selectRealName, name, ngsiDevice),
                    lwm2mLib.getRegistry().getByName,
                    async.apply(readAttributes, attributes, ngsiDevice),
                    async.apply(createContextElement, ngsiDevice)
                ],
                callback
            );
        }
    });
}

function updateConfiguration(newConfiguration, callback) {
    var found = false;

    if (!config.lwm2m.types) {
        config.lwm2m.types = [];
    }

    for (var i = 0; i < config.lwm2m.types.length; i++) {
        if (config.lwm2m.types[i].name === newConfiguration.type) {
            config.lwm2m.types[i].url = newConfiguration.resource;
        }
    }

    if (!found) {
        config.lwm2m.types.push({
            name: newConfiguration.type,
            url: newConfiguration.resource
        });
    }

    callback();
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
exports.ngsiUpdate = ngsiUpdateHandler;
exports.ngsiExecute = ngsiExecuteHandler;
exports.ngsiQuery = ngsiQueryHandler;
exports.updateConfiguration = updateConfiguration;
