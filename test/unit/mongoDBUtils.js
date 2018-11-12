/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of fiware-iotagent-lib
 *
 * fiware-iotagent-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * fiware-iotagent-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with fiware-iotagent-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */
'use strict';

var MongoClient = require('mongodb').MongoClient,
    async = require('async');

function cleanDb(host, name, callback) {

    // FIXME: this code doesn't work with MongoDB replica set, we are assuming that an 
    // standalone MongoDB instance is used to run unit test.To use a replica set this
    // needs to be adapted
    var url = 'mongodb://' + host + ':27017/' + name;
    MongoClient.connect(
        url,
        {
            useNewUrlParser: true,
            connectTimeoutMS: 500
        },
        function(err, db) {

        if (db) {

            var collections = ['devices', 'groups', 'entities', 'registrations'];

            for (var i in collections) {
                var collection = db.db().collection(collections[i]);

                if (collection) {
                    collection.drop();
                }
            }

            db.close();
        }

        callback();
    });
}

function cleanDbs(host, callback) {
    var operations = [
            async.apply(cleanDb, 'localhost', 'lwtm2m'),
            async.apply(cleanDb, 'localhost', 'iotagent'),
            async.apply(cleanDb, host, 'orion'),
            async.apply(cleanDb, host, 'iotagent')
        ],
        remoteDatabases = [
            'smartgondor',
            'dumbmordor'
    ];

    for (var i in remoteDatabases) {
        operations.push(async.apply(cleanDb, host, 'orion-' + remoteDatabases[i]));
    }

    async.series(operations, callback);
}

exports.cleanDb = cleanDb;
exports.cleanDbs = cleanDbs;
