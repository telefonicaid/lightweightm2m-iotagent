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

var cheerio = require('cheerio'),
  async = require('async'),
  fs = require('fs'),
  request = require('request'),
  errors = require('../lib/errors'),
  logger = require('logops'),
  context = {
    op: 'IOTAgent.OMARegistry'
  },
  registryTargetFile = 'omaRegistry.json',
  inverseRegistryTargetFile = 'omaInverseRegistry.json',
  DOMParser = require('xmldom').DOMParser,
  _ = require('underscore');


function downloadRegistry(url) {
  return function(callback) {
    var options = {
      uri: url,
      method: 'GET'
    };

    request(options, function(error, response, body) {
      if (error) {
        logger.error(context, 'Couldn\'t retrieve OMA Registry due to a connection error: ' + error);
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
  var $ = cheerio.load(registryData),
    initiateData = false,
    registry = [];

  $('tr').each(function(i, elem) {
    if (!initiateData && $.html(this).indexOf('URN') > 0) {
      logger.info('Initiating data parse.');
      initiateData = true;
    } else if (initiateData) {
      if ($($(this).find('td').get(1)).text().indexOf('urn') >= 0) {
        var obj = {
          name: $($(this).find('td').get(2)).text(),
          urn: $($(this).find('td').get(1)).text(),
          id: $($(this).find('td').get(0)).text(),
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
      downloadRegistry(item.schema)(function(error, body) {
        if (error) {
          callback(error);
        } else {
          var doc = new DOMParser().parseFromString(body),
            items = doc.getElementsByTagName('Item'),
            newObj = _.clone(item);

          newObj.resources = [];
          for (var i = 0; i < items.length; i++) {
            var resource = {
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
      for (var i = 0; i < current.resources.length; i++) {
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

  var directRegistryMap = registryObj.reduce(createMapWithIds, {}),
    inverseRegistryMap = registryObj.reduce(createMapFromIds, {});

  callback(null, JSON.stringify(directRegistryMap, null, 4), JSON.stringify(inverseRegistryMap, null, 4));
}

function writeResults(directMappings, inverseMappings, callback) {
  async.series([
    async.apply(fs.writeFile, registryTargetFile, directMappings),
    async.apply(fs.writeFile, inverseRegistryTargetFile, inverseMappings)
  ], callback);
}

function processRegistry(callback) {
  async.waterfall([
    downloadRegistry('http://technical.openmobilealliance.org' +
      '/Technical/technical-information/omna/lightweight-m2m-lwm2m-object-registry'),
    parseRegistry,
    discoverResources,
    createInternalMap,
    writeResults
  ], callback);
}

processRegistry(function(error) {
  if (error) {
    console.log('Download OMA Registry failed: ' + error);
  } else {
    console.log('OMA Registry successfully downloaded');
  }
});
