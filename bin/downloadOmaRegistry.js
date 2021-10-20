#!/usr/bin/env node

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

/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const request = require('iotagent-node-lib').request;
const errors = require('../lib/errors');
const logger = require('logops');
const context = {
    op: 'IOTAgent.OMARegistry'
};
const registryTargetFile = 'omaRegistry.json';
const inverseRegistryTargetFile = 'omaInverseRegistry.json';
const DOMParser = require('xmldom').DOMParser;
const _ = require('underscore');

function downloadRegistry(url) {
    return function (callback) {
        const options = {
            uri: url,
            method: 'GET',
            responseType: 'text'
        };
        request(options, function (error, response, body) {
            if (error) {
                logger.error(context, "Couldn't retrieve OMA Registry due to a connection error: " + error);
                callback(new errors.OmaRegistryConnectionError(error));
            } else if (response.statusCode === 200) {
                callback(null, body);
            } else {
                callback(new errors.OmaRegistryServerError(response.statusCode));
            }
        });
    };
}

function parseRegistry(registryData, callback) {
    const $ = cheerio.load(registryData);
    let initiateData = false;
    const registry = [];

    $('tr').each(function (i, elem) {
        if (!initiateData && $.html(this).indexOf('URN') > 0) {
            logger.info('Initiating data parse.');
            initiateData = true;
        } else if (initiateData) {
            // prettier-ignore
            if ($($(this).find('td').get(1)).text().indexOf('urn') >= 0) {
                const obj = {
                    // prettier-ignore
                    name: $($(this).find('td').get(2)).text(),
                    // prettier-ignore
                    urn: $($(this).find('td').get(1)).text(),
                    // prettier-ignore
                    id: $($(this).find('td').get(0)).text(),
                    // prettier-ignore
                    schema: $($(this).find('td').get(3)).find('a').attr('href')
                };

                if (obj.name && obj.id) {
                    registry.push(obj);
                }
            }
        }
    });

    callback(null, registry);
}

function discoverResources(registryObj, callback) {
    function retrieveResources(item, callback) {
        if (item.schema) {
            downloadRegistry(item.schema)(function (error, body) {
                if (error) {
                    callback(error);
                } else {
                    const doc = new DOMParser().parseFromString(body);
                    const items = doc.getElementsByTagName('Item');
                    const newObj = _.clone(item);

                    newObj.resources = [];
                    for (let i = 0; i < items.length; i++) {
                        const resource = {
                            name: items[i].getElementsByTagName('Name')[0].textContent,
                            type: items[i].getElementsByTagName('Type')[0].textContent,
                            operations: items[i].getElementsByTagName('Operations')[0].textContent
                        };

                        newObj.resources.push(resource);
                    }
                    callback(null, newObj);
                }
            });
        } else {
            callback(null, item);
        }
    }

    async.map(registryObj, retrieveResources, callback);
}

function createInternalMap(registryObj, callback) {
    function createMapWithIds(previous, current) {
        previous[current.id] = current;

        return previous;
    }

    function createMapFromIds(previous, current) {
        if (current.resources) {
            for (let i = 0; i < current.resources.length; i++) {
                previous[current.resources[i].name] = {
                    objectResource: i,
                    objectType: current.id,
                    objectInstance: 0,
                    operations: current.resources[i].operations
                };
            }
        } else {
            previous[current.name] = {
                objectResource: 0,
                objectType: current.id,
                objectInstance: null
            };
        }

        return previous;
    }

    const directRegistryMap = registryObj.reduce(createMapWithIds, {});
    const inverseRegistryMap = registryObj.reduce(createMapFromIds, {});

    callback(null, JSON.stringify(directRegistryMap, null, 4), JSON.stringify(inverseRegistryMap, null, 4));
}

function writeResults(directMappings, inverseMappings, callback) {
    async.series(
        [
            async.apply(fs.writeFile, registryTargetFile, directMappings),
            async.apply(fs.writeFile, inverseRegistryTargetFile, inverseMappings)
        ],
        callback
    );
}

function processRegistry(callback) {
    async.waterfall(
        [
            downloadRegistry(
                'http://technical.openmobilealliance.org' +
                    '/Technical/technical-information/omna/lightweight-m2m-lwm2m-object-registry'
            ),
            parseRegistry,
            discoverResources,
            createInternalMap,
            writeResults
        ],
        callback
    );
}

processRegistry(function (error) {
    if (error) {
        console.log('Download OMA Registry failed: ' + error);
    } else {
        console.log('OMA Registry successfully downloaded');
    }
});
