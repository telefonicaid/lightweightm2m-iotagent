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
 *
 * Modified by: Daniel Calvo - ATOS Research & Innovation
 */
'use strict';

var iotAgentLib = require('iotagent-node-lib'),
    lwm2mLib = require('lwm2m-node-lib').server,
    registration= require('./registration'),
    logger = require('logops'),
    async = require('async'),
    context = {
        op: 'IOTAgent.LWM2MHandlers'
    };

/**
 * Handles an unregistration request coming from a LWM2M device.
 *
 * @param {Object} device       LWM2M Device object.
 */
function unregistrationHandler(device, callback) {
    logger.debug(context, 'Handling unregistration of the device');

    function handleIncomingUnregistrationRequest(error, lwm2mDevice, configuration) {

        if (error) {
            callback(error);
        } else {
        	iotAgentLib.unregister(device.name,configuration.service,configuration.subservice, callback);
        };
    }

    async.waterfall([
        async.apply(registration.findConfiguration,device),
    ], handleIncomingUnregistrationRequest);
}

exports.handler = unregistrationHandler;
