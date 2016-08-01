/**
 * Corus JS Client
 * Copyright (c) 2016 Corus.io <juancarlos.vinas@corus.io>
 * MIT Licensed
 */

/*
 * Requires
 */

var request = require('request');
var WebSocket = require('ws');
var events = require('events');
var assign = require('object-assign');
var querystring = require('querystring');
var util = require('util');

/**
 * HttpError
 */

var HttpError = function(statusCode, message){

    Error.call(this);

    this.message = message || 'Unknown error';

    this.statusCode = statusCode || 500;

};

/**
 * Private Methods
 */

var requestInvokeFn = function(options){

    return function(bodyOrFilter, callback){

        if(!callback){

            callback = bodyOrFilter;
            bodyOrFilter = null;

        }

        if(!callback){

            callback = function(){};

        }

        if(bodyOrFilter) {

            if (options.method === 'POST' || options.method === 'PUT') {

                options = assign({}, options, {json: true, body: bodyOrFilter});

            } else {

                var filter = assign({}, bodyOrFilter);

                if(filter.where){

                    filter.where = JSON.stringify(filter.where);

                }

                if(filter.aggregation){

                    filter.aggregation = JSON.stringify(filter.aggregation);

                }

                if(filter.groupBy){

                    filter.groupBy = JSON.stringify(filter.groupBy);

                }

                options.url += '?' + querystring.stringify(filter);

            }

        }

        request(options, function(err, response, body){

            if(err){

                callback(err);

            } else if(response.statusCode < 200 || response.statusCode >= 400) {

                callback(new HttpError(response.statusCode, body));

            } else {

                var jsonBody = body;

                try { jsonBody = JSON.parse(body); } catch(e){}

                callback(null, jsonBody);

            }

            //Limpiamos el callback para evitar leaks de memoria

            callback = null;
            return;

        });

    };

};

var checkCredentials = function(headers){

    if(!headers.key){

        throw new Error('Invalid credentials');

    }

};

var pushInvokeFn = function(options, filter){

    return function(notification, callback){

        var body = {

            notification: notification,
            filter: filter

        };

        options = assign({}, options, {method: 'POST', json: true, body: body});

        request(options, function(err, response, body){

            if(err){

                callback(err);

            } else if(response.statusCode < 200 || response.statusCode >= 400) {

                callback(new HttpError(response.statusCode, body));

            } else {

                var jsonBody = body;

                try { jsonBody = JSON.parse(body); } catch(e){ }

                callback(null, jsonBody);

            }

            //Limpiamos el callback para evitar leaks de memoria

            callback = null;
            return;

        });

    }

};

var formInvokeFn = function(options){

    return function(fileJson, callback) {

        var buffer = null;

        if (fileJson.base64) {

            buffer = new Buffer(fileJson.base64, 'base64');

        }

        if (!buffer) {

            return callback(new HttpError(400, 'Image not found in HTTP request'));

        } else {

            var formDataOptions = assign({formData: {
                file: {
                    value: buffer,
                    options:{
                        filename: fileJson.filename || null,
                        contentType: fileJson.contentType || null
                    }
                }
            }}, options);

            request(formDataOptions, function (err, response, body) {

                if (err) {

                    callback(err);

                } else if (response.statusCode < 200 || response.statusCode >= 400) {

                    callback(new HttpError(response.statusCode, body));

                } else {

                    callback(null);

                }

            });

        }

    }

};

/**
 * Constructor
 *
 * @param options
 * Must contain a "host" property (ex: http://mycorp.corus.io)
 * Can contain a "key" property. If not supplied, then we must invoke "login" before any other method.
 */

var Corus = function(options){

    /**
     * Private Properties
     */

    var baseUrl = 'http://';
    var baseChannelsUrl = 'http://';
    var baseWSUrl = 'ws://';

    var baseHeaders = {};

    /**
     * Check Options
     */

    if(!options){

        throw new Error('options json is required');

    }

    if(!options.host){

        throw new Error('options must contain a "host" property');

    } else {

        baseUrl += options.host + '/api/v1';
        baseChannelsUrl += options.host;
        baseWSUrl += options.host;

    }

    if(options.key){

        baseHeaders.key = options.key;

    }

    if(options.lang){

        baseHeaders.lang = options.lang;

        if(options.fillWithDefaultLang){

            baseHeaders['fill-with-default-lang'] = 'true';

        }

    }

    if(options.avoidTrigger){

        // avoid-trigger: To avoid infinete recursive loops when invoking collection's data methods.

        baseHeaders['avoid-trigger'] = 'true';

    }

    /**
     * Login
     */

    this.login = function(emailAndPassword, callback){

        var url = baseUrl + '/me';

        var options = {

            url: url,
            headers: {
                authorization: 'Basic ' + new Buffer(emailAndPassword.email + ":" + emailAndPassword.password).toString('base64')
            }

        };

        requestInvokeFn(options)(function(err, user){

            if(!callback){

                callback = function(){};

            }

            if(err){

                return callback(err);

            } else {

                if(!baseHeaders.key) {

                    baseHeaders.key = user.key;

                }

                return callback(null, user);

            }

        });

    };

    /**
     * Users
     */

    this.users = function(user){

        //Check if we have a valid "key"
        checkCredentials(baseHeaders);

        var url = baseUrl + '/users';
        var headers = assign({}, baseHeaders);

        if(!user){

            return {

                //POST ==> /users

                post: requestInvokeFn({method: 'POST', url: url, headers: headers}),

                //GET ==> /users

                get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

            }

        } else {

            url += '/' + user;

            return {

                //GET ==> /users/:user

                get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                //PUT ==> /users/:user

                put: requestInvokeFn({method: 'PUT', url: url, headers: headers}),

                //DELETE ==> /users/:user

                delete: requestInvokeFn({method: 'DELETE', url: url, headers: headers}),

                /**
                 * Avatar
                 */

                avatar: function(){

                    url += '/avatar';

                    return {

                        put: formInvokeFn({method: 'PUT', url: url, headers: headers})

                    }

                },

                /**
                 * Apps
                 */

                apps: function(app){

                    url += '/apps';

                    if(!app){

                        throw new Error('Invalid app');

                    } else {

                        url += '/' + app;

                        return {

                            //GET ==> /users/:user/apps/:app

                            get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                            //PUT ==> /users/:user/apps/:app

                            put: requestInvokeFn({method: 'PUT', url: url, headers: headers}),

                            //DELETE ==> /users/:user/apps/:app

                            delete: requestInvokeFn({method: 'DELETE', url: url, headers: headers})
                        }

                    }

                }

            }

        }

    };

    /**
     * Apps
     */

    this.apps = function(app){

        //Check if we have a valid "key"
        checkCredentials(baseHeaders);

        var url = baseUrl + '/apps';
        var headers = assign({}, baseHeaders);

        if(!app){

            return {

                //POST ==> /apps

                post: requestInvokeFn({method: 'POST', url: url, headers: headers}),

                //GET ==> /apps

                get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

            }

        } else {

            url += '/' + app;

            return {

                //GET ==> /apps/:app

                get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                //PUT ==> /apps/:app

                put: requestInvokeFn({method: 'PUT', url: url, headers: headers}),

                //DELETE ==> /apps/:app

                delete: requestInvokeFn({method: 'DELETE', url: url, headers: headers}),

                /**
                 * Collections
                 */

                collections: function(collection){

                    url += '/collections';

                    if(!collection){

                        return {

                            //POST ==> /apps/:app/collections

                            post: requestInvokeFn({method: 'POST', url: url, headers: headers}),

                            //GET ==> /apps/:app/collections

                            get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                        }

                    } else {

                        url += '/' + collection;

                        return {

                            //GET ==> /apps/:app/collections/:collection

                            get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                            //PUT ==> /apps/:app/collections/:collection

                            put: requestInvokeFn({method: 'PUT', url: url, headers: headers}),

                            //DELETE ==> /apps/:app/collections/:collection

                            delete: requestInvokeFn({method: 'DELETE', url: url, headers: headers}),

                            /**
                             * Data
                             */

                            data: function(id){

                                url += '/data';

                                if(!id){

                                    return {

                                        //POST ==> /apps/:app/collections/:collection/data

                                        post: requestInvokeFn({method: 'POST', url: url, headers: headers}),

                                        //GET ==> /apps/:app/collections/:collection/data

                                        get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                                    }

                                } else {

                                    url += '/' + id;

                                    return {

                                        //GET ==> /apps/:app/collections/:collection/data/:id

                                        get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                                        //PUT ==> /apps/:app/collections/:collection/data/:id

                                        put: requestInvokeFn({method: 'PUT', url: url, headers: headers}),

                                        //DELETE ==> /apps/:app/collections/:collection/data/:id

                                        delete: requestInvokeFn({method: 'DELETE', url: url, headers: headers}),

                                    }

                                }

                            }

                        }

                    }

                },

                /**
                 * Users
                 */

                users: function(email){

                    var pushUrl = url + '/push';
                    url += '/users';

                    return {

                        //GET ==> /apps/:app/users

                        get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                        //POST ==> /apps/:app/push

                        push: pushInvokeFn({url: pushUrl, headers: headers}, {where: {createdBy: email}})

                    }

                },

                /**
                 * Installations
                 */

                installations: function(device){

                    var pushUrl = url + '/push';
                    url += '/installations';

                    if(!device){

                        return {

                            //POST ==> /apps/:app/installations

                            post: requestInvokeFn({method: 'POST', url: url, headers: headers}),

                            //POST ==> /apps/:app/push

                            push: function(notification, where, callback){

                                pushInvokeFn({url: pushUrl, headers: headers}, {where: where})(notification, callback);

                            }

                        }

                    } else {

                        url += '/' + device;

                        return {

                            //GET ==> /apps/:app/installations/:device

                            get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                            //DELETE ==> /apps/:app/installations/:device

                            delete: requestInvokeFn({method: 'DELETE', url: url, headers: headers}),

                            //POST ==> /apps/:app/push

                            push: pushInvokeFn({url: pushUrl, headers: headers}, {where: {device: device}})

                        }

                    }

                }

            }

        }

    };

    /**
     * Channels
     */

    this.channels = function(app){

        //Check if we have a valid "key"
        checkCredentials(baseHeaders);

        var wsUrl = baseWSUrl + '/channels';
        var url = baseChannelsUrl + '/channels';
        var headers = assign({}, baseHeaders);

        if(!app) {

            throw new Error('Invalid app');

        } else if(!headers.key){

            throw new Error('Invalid user key');

        } else {

            url += '/' + app;
            wsUrl += '/' + app + '?key=' + headers.key;

            return {

                connect: function(){

                    var ws = new WebSocket(wsUrl);
                    var eventEmitter = new events.EventEmitter();

                    /**
                     * WS Events
                     */

                    ws.on('open', function(){

                        setTimeout(function(){

                            eventEmitter.emit('connected');

                        }, 500);

                    });

                    ws.on('error', function(err){

                        eventEmitter.emit('error', new Error('WS Error: ' + err.toString()));

                    });

                    ws.on('message', function(data){

                        var json  = null;

                        try { json = JSON.parse(data) } catch(e) { };

                        if(!json){

                            eventEmitter.emit('error', new Error('Invalid message'));

                        } else if(json.err){

                            eventEmitter.emit('error', json.err);

                        } else {

                            eventEmitter.emit('message', json.message);

                        }

                    });

                    /**
                     * Send Method
                     */

                    eventEmitter.send = function(to, data){

                        if(!to){

                            throw new Error('"to" parameter is required')

                        }

                        if(!data){

                            throw new Error('"data" parameter is required')

                        }

                        var jsonStr = JSON.stringify({

                            to: to,
                            data: data

                        });

                        ws.send(jsonStr);

                    };

                    return eventEmitter;

                },

                post: requestInvokeFn({method: 'POST', url: url, headers: headers})


            }

        }

    };

};

/**
 * Export
 */

module.exports = Corus;

/**
 * Aux Libs
 */

module.exports.libs = {

    async: require('async')

};

