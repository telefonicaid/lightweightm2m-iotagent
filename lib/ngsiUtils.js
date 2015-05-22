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

var request = require('request');

/**
 * Updates the information in a Context Broker entity.
 *
 * @param {String} host             Host where the Context Broker is installed.
 * @param {Number} port             Port where the Context Broker is listening.
 * @param {String} service          Service the entity belongs to.
 * @param {String} subservice       Subservice of the service where the entity was created.
 * @param {String} name             Id of the entity to query.
 * @param {String} type             Type of the entity to query.
 * @param {Array} attributes        List of attributes to retrieve, along with their types and values.
 */
function updateEntity(host, port, service, subservice, name, type, attributes, callback) {
    var options = {
        url: 'http://' + host + ':' + port + '/v1/updateContext',
        method: 'POST',
        headers: {
            'fiware-service': service,
            'fiware-servicepath': subservice
        },
        json: {
            contextElements: [
                {
                    type: type,
                    id: name,
                    isPattern: 'false',
                    attributes: attributes
                }
            ],
            updateAction: 'UPDATE'
        }
    };

    request(options, callback);
}

/**
 * Query the information for a Context Broker entity.
 *
 * @param {String} host             Host where the Context Broker is installed.
 * @param {Number} port             Port where the Context Broker is listening.
 * @param {String} service          Service the entity belongs to.
 * @param {String} subservice       Subservice of the service where the entity was created.
 * @param {String} id               Id of the entity to query.
 * @param {String} type             Type of the entity to query.
 * @param {Array} attributes        List of attributes to retrieve.
 */
function queryEntity(host, port, service, subservice, id, type, attributes, callback) {
    var options = {
        url: 'http://' + host + ':' + port + '/v1/queryContext',
        method: 'POST',
        headers: {
            'fiware-service': service,
            'fiware-servicepath': subservice
        },
        json: {
            entities: [
                {
                    type: type,
                    id: id,
                    isPattern: 'false'
                }
            ],
            attributes: attributes
        }
    };

    request(options, callback);
}

/**
 * Get the context providers for a list of attributes of an entity.
 *
 * @param {String} host             Host where the Context Broker is installed.
 * @param {Number} port             Port where the Context Broker is listening.
 * @param {String} service          Service the entity belongs to.
 * @param {String} subservice       Subservice of the service where the entity was created.
 * @param {String} id               Id of the entity to query.
 * @param {String} type             Type of the entity to query.
 * @param {Array} attributes        List of attributes to retrieve.
 */
function discoverContextAvailability(host, port, service, subservice, id, type, attributes, callback) {
    var options = {
        url: 'http://' + host + ':' + port + '/v1/registry/discoverContextAvailability ',
        method: 'POST',
        headers: {
            'fiware-service': service,
            'fiware-servicepath': subservice
        },
        json: {
            entities: [
                {
                    type: type,
                    id: id,
                    isPattern: 'false'
                }
            ],
            attributes: attributes
        }
    };

    request(options, callback);
}

function createClient(host, port, service, subservice) {
    /*jshint validthis:true */

    return {
        query: queryEntity.bind(null, host, port, service, subservice),
        update: updateEntity.bind(null, host, port, service, subservice),
        discover: discoverContextAvailability.bind(null, host, port, service, subservice)
    };
}

exports.updateEntity = updateEntity;
exports.queryEntity = queryEntity;
exports.discoverContext = discoverContextAvailability;
exports.create = createClient;
