/**
 * Corus JS Client
 * Copyright (c) 2016 Corus.io <juancarlos.vinas@corus.io>
 * MIT Licensed
 */

/*
 * Requires
 */

var request = require('request');
var assign = require('object-assign');
var querystring = require('querystring');

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

                return callback(err);

            } else if(response.statusCode < 200 || response.statusCode >= 400) {

                return callback(new HttpError(response.statusCode, body));

            } else {

                var jsonBody = body;

                try{

                    jsonBody = JSON.parse(body);

                } catch(e){

                    //Do nothing...

                }

                return callback(null, jsonBody);

            }

        });

    };

};

var checkCredentials = function(headers){

    if(!headers.key){

        throw new Error('Invalid credentials');

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

                baseHeaders.key = user.key;
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

                //GET ==> /apps/:user

                get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                //PUT ==> /apps/:user

                put: requestInvokeFn({method: 'PUT', url: url, headers: headers}),

                //DELETE ==> /apps/:user

                delete: requestInvokeFn({method: 'DELETE', url: url, headers: headers}),

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

                            //GET ==> /users/:users/apps/:app

                            get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                            //PUT ==> /users/:users/apps/:app

                            put: requestInvokeFn({method: 'PUT', url: url, headers: headers}),

                            //DELETE ==> /users/:users/apps/:app

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
                 * Collections
                 */

                users: function(){

                    url += '/users';

                    return {

                        //GET ==> /apps/:app/users

                        get: requestInvokeFn({method: 'GET', url: url, headers: headers}),

                    }

                }

            }

        }

    };

};

/**
 * Export
 */

module.exports = Corus;

