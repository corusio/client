/**
 * Requires
 */

var tap = require('tap');
var packageJson = require('../package.json');
var Corus = require('../lib/index.js');

/**
 * Private
 */

var corus = corus = new Corus({host: 'jsc.corus.io'});
var config = packageJson.config;

/**
 * Constants
 */

var TEST_APP_SLUG = 'kit';
var TEST_TARGET_PUSH_USER = 'test@start.cat';

/**
 * Login
 */

tap.test('Valid login', function(test){

    corus.login({email: 'juancarlos.vinas@start.cat', password: 'StartCat'}, function(err, user){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(user, 'User not returned');
        test.true(user.key, 'User dont have a key');
        test.end();

    });

});

/**
 * Push USER
 */

tap.test('Send a push to a specific user', function(test){

    var notification = {

        title:'Hola',
        body: 'Comoo va',
        //icon: null,
        //collapseKey: null,
        //badge:1,
        //sound: null,
        data: {
            value1: 'value1',
            value2: 'value2'
        }

    };

    corus.apps(TEST_APP_SLUG).users('test@start.cat').push(notification, function(err, result){

        //result.android => Count of pushes sent to android devices (>= 0)
        //result.ios => Count of pushes sent to iOS devices (>= 0)

        test.true(result && (result.android + result.ios > 0), 'Push sent!');
        test.end();

    });

});