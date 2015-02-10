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
    logger = require('logops'),
    async = require('async'),
    config,
    context = {
        op: 'IOTAgent.NGSIHandlers'
    };


function readAttribute(deviceId, type, attribute, innerCallback) {
    if (config.ngsi.types[type].lwm2mResourceMapping[attribute]) {
        lwm2mLib.read(
            deviceId,
            config.ngsi.types[type].lwm2mResourceMapping[attribute].objectType,
            config.ngsi.types[type].lwm2mResourceMapping[attribute].objectInstance,
            config.ngsi.types[type].lwm2mResourceMapping[attribute].objectResource,
            innerCallback);

    } else {
        innerCallback(new Error('Couldn\'t find LWM2M mapping for attributes'));
    }
}

function writeAttribute(deviceId, type, attribute, innerCallback) {
    if (config.ngsi.types[type].lwm2mResourceMapping[attribute.name]) {
        lwm2mLib.write(
            deviceId,
            config.ngsi.types[type].lwm2mResourceMapping[attribute.name].objectType,
            config.ngsi.types[type].lwm2mResourceMapping[attribute.name].objectInstance,
            config.ngsi.types[type].lwm2mResourceMapping[attribute.name].objectResource,
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

    function createContextElement(attributeValues, callback) {
        var contextElement = {
            type: type,
            isPattern: false,
            id: id,
            attributes: []
        };

        for (var i = 0; i < attributes.length; i++) {
            var attributeType = 'string';

            for (var j = 0; j < config.ngsi.types[type].lazy.length; j++) {
                if (config.ngsi.types[type].lazy[j].name === attributes[i]) {
                    attributeType = config.ngsi.types[type].lazy[j].type;
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

    async.waterfall([
        async.apply(iotAgentLib.getDeviceByName, id),
        async.apply(selectRealName, name),
        lwm2mLib.getRegistry().getByName,
        async.apply(readAttributes, attributes),
        createContextElement
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
exports.ngsiUpdate = ngsiUpdateHandler;
exports.ngsiQuery = ngsiQueryHandler;
