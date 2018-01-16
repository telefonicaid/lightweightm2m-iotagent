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
    commonLwm2m = require('./commonLwm2m'),
    registration = require('./registration'),
    errors = require('../../errors'),
    logger = require('logops'),
    async = require('async'),
    apply = async.apply,
    context = {
        op: 'IOTAgent.LWM2MHandlers'
    };

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

    function handleIncomingUpdateRegistrationRequest(lwm2mDevice, configuration) {
        iotAgentLib.getDevice(
            lwm2mDevice.name,
            configuration.service,
            configuration.subservice, function(error, ngsiDevice) {

                if (error) {
                    logger.debug(context, 'An error was encountered updateing device registration.');
                    callback(error);
                }
                else if (ngsiDevice) {
                    logger.debug(context, 'Preregistered device found.');
                    commonLwm2m.observeActiveAttributes(payload, ngsiDevice, callback);
                } else {
                    logger.debug(context, 'Impossible to find a proper way to deal with the update registration');
                    callback(new errors.UnknownInternalError(
                        'Impossible to find a proper way of dealing with the registration'));
                }
            });
    }

    async.waterfall([
        removePreviousSubscriptions,
        apply(registration.findConfiguration, device),
        handleIncomingUpdateRegistrationRequest
    ], callback);
}

exports.handler = updateRegistration;
