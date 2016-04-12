/**
 * Requires
 */

var tap = require('tap');
var packageJson = require('../package.json');
var Corus = require('../lib/index.js');

/**
 * Private
 */

var corus = null;
var config = packageJson.config;
var dataItem = null;
var channelConnection1 = null;
var channelConnection2 = null;

/**
 * Constants
 */

var TEST_APP_SLUG = 'test_system';

/**
 * Constructor
 */

tap.test('Client constructor', function(test){

    corus = new Corus({host: config.HOST});
    test.ok(corus, 'Corus client not created');
    test.ok(corus.login, 'Login method not found');
    test.end();

});

/**
 * Login
 */

tap.test('Valid login', function(test){

    corus.login({email: config.USER, password: config.PASSWORD}, function(err, user){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(user, 'User not returned');
        test.true(user.key, 'User dont have a key');
        test.end();

    });

});

/**
 * Channels
 */

tap.test('Connect to channel', function(test){

    var channel = corus.channels(TEST_APP_SLUG).connect();

    channel.on('connected', function(){

        test.true(true, 'Connected to channel');
        channel.send(config.USER, {});

    });

    channel.on('message', function(message){

        test.true(message, 'Message received!');
        test.end();

    });

});