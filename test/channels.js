/**
 * Requires
 */

var tap = require('tap');
var packageJson = require('../package.json');
var Corus = require('../lib/index.js');

/**
 * Private
 */

var config = packageJson.config;
var corus = corus = new Corus({host: config.HOST});
var channel = null;

/**
 * Constants
 */

var TEST_APP_SLUG = 'kit';

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

/*tap.test('Invalid connection to channel', function(test){

    channel = corus.channels('invalid_app_slug').connect();

    channel.on('error', function(err){

        test.true(err, 'Error returned');

    });

});*/

/*tap.test('Connect to channel', function(test){

    channel = corus.channels(TEST_APP_SLUG).connect();

    channel.on('connected', function(){

        test.true(true, 'Connected to channel');
        channel.send(config.USER, {test: 'value1'});

    });

    channel.on('message', function(message){

        test.true(message && message.data && message.data.test === 'value1', 'Message received!');
        test.end();

    });

});*/

tap.test('Post a message to channel via REST', function(test){

    corus.channels(TEST_APP_SLUG).post({to: config.USER, data: {test: 'value2'}}, function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result && result.sent, 'Message sent!');

        channel.on('message', function(message){

            test.true(message && message.data && message.data.test === 'value2', 'Message received!');
            test.end();

        });

        test.end();

    });

});