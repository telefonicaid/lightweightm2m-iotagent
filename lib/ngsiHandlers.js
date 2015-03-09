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
    omaInverseRegistry = require('../omaRegistryInverseMap.json'),
    async = require('async'),
    config,
    context = {
        op: 'IOTAgent.NGSIHandlers'
    };

function extractMapping(type, attribute) {
    var mapping;

    if (config.ngsi.types[type] &&
        config.ngsi.types[type].lwm2mResourceMapping &&
        config.ngsi.types[type].lwm2mResourceMapping[attribute]) {
        mapping = config.ngsi.types[type].lwm2mResourceMapping[attribute];
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

function readAttribute(deviceId, type, attribute, innerCallback) {
    var mapping = extractMapping(type, attribute);

    if (mapping) {
        lwm2mLib.read(
            deviceId,
            mapping.objectType,
            mapping.objectInstance,
            mapping.objectResource,
            innerCallback);

    } else {
        innerCallback(new Error('Couldn\'t find LWM2M mapping for attributes'));
    }
}

function writeAttribute(deviceId, type, attribute, innerCallback) {
    var mapping = extractMapping(type, attribute.name);

    if (mapping) {
        lwm2mLib.write(
            deviceId,
            mapping.objectType,
            mapping.objectInstance,
            mapping.objectResource,
            attribute.value,
            innerCallback);

    } else {
        innerCallback(new Error('Couldn\'t find LWM2M mapping for attributes'));
    }
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
function ngsiUpdateHandler(id, type, attributes, callback) {
    var name = id.substring(0, id.indexOf(':'));

    logger.debug(context, 'Handling device data update from the northbound for device [%s] of type [%s]', id, type);
    logger.debug(context, 'New attributes;\n%s', attributes);

    function updateDevice(device, innerCallback) {
        async.map(
            attributes,
            async.apply(writeAttribute, device.id, device.type),
            innerCallback);
    }

    if (!name) {
        name = id;
    }

    async.waterfall([
        async.apply(iotAgentLib.getDeviceByName, id),
        async.apply(selectRealName, name),
        lwm2mLib.getRegistry().getByName,
        updateDevice
    ], callback);
}

/**
 * Handle queries coming to the IoT Agent via de Context Provider API (as a consequence of a query to a passive
 * attribute redirected by the Context Broker).
 *
 * @param {String} id           Entity name of the selected entity in the query.
 * @param {String} type         Type of the entity.
 * @param {Array} attributes    List of attributes to read.
 */
function ngsiQueryHandler(id, type, attributes, callback) {
    var name = id.substring(0, id.indexOf(':'));

    logger.debug(context, 'Handling device data query from the northbound for device [%s] of type [%s]', id, type);
    logger.debug(context, 'New attributes;\n%s', attributes);

    function createContextElement(device, attributeValues, callback) {
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

    function readAttributes(attributes, device, innerCallback) {
        async.map(
            attributes,
            async.apply(readAttribute, device.id, device.type),
            innerCallback);
    }

    if (!name) {
        name = id;
    }

    iotAgentLib.getDeviceByName(id, function(error, device) {
        if (error) {
            callback(error);
        } else {
            async.waterfall([
                async.apply(selectRealName, name, device),
                lwm2mLib.getRegistry().getByName,
                async.apply(readAttributes, attributes),
                async.apply(createContextElement, device)
            ], callback);
        }
    });
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
exports.ngsiQuery = ngsiQueryHandler;
