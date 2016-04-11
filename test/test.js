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

var TEST_APP_SLUG = 'corus_client_test_app';
var TEST_COLLECTION_SLUG = 'corus_client_test_collection';
var TEST_USERS_EMAIL = 'test_user_' + (new Date()).getTime() + '@test.com';


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

tap.test('Invalid login', function(test){

    corus.login({email: config.USER, password: 'InvalidPassword'}, function(err, user){

        test.true(err, 'Error not returned');
        test.true(err.statusCode, 'Error status code not found');
        test.false(user, 'User should be undefined');
        test.end();

    });

});

tap.test('Valid login', function(test){

    corus.login({email: config.USER, password: config.PASSWORD}, function(err, user){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(user, 'User not returned');
        test.true(user.key, 'User dont have a key');
        test.end();

    });

});

/**
 * Apps
 */

tap.test('List Apps', function(test){

    corus.apps().get(function(err, apps){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(apps, 'Apps not found');
        test.end();

    });

});

tap.test('Remove app', function(test){

    corus.apps(TEST_APP_SLUG).delete(function(err){

        test.true(!err || err.statusCode == 404, 'Error returned: ' + JSON.stringify(err));
        test.end();

    });

});

tap.test('Create app', function(test){

    corus.apps().post({slug: TEST_APP_SLUG, name: 'Test App'}, function(err, app){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(app, 'New app not returned');
        test.end();

    });

});

tap.test('Get created app', function(test){

    corus.apps(TEST_APP_SLUG).get(function(err, app){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(app, 'New app not returned');
        test.true(app.slug === TEST_APP_SLUG, 'Invalid app slug: ' + app.slug);
        test.end();

    });

});

tap.test('Update app', function(test){

    corus.apps(TEST_APP_SLUG).put({name: 'Updated Name'}, function(err){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.end();

    });

});

tap.test('Check updated app', function(test){

    corus.apps(TEST_APP_SLUG).get(function(err, app){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(app.name === 'Updated Name', 'App not updated');
        test.end();

    });

});

/**
 * Collections
 */

tap.test('Get collections', function(test){

    corus.apps(TEST_APP_SLUG).collections().get(function(err, collections){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(collections, 'Collections not found');
        test.end();

    });

});

tap.test('Create collection', function(test){

    corus.apps(TEST_APP_SLUG).collections().post({slug: TEST_COLLECTION_SLUG, name: 'Test Collection'}, function(err, collection){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(collection, 'New collection not returned');
        test.end();

    });

});

tap.test('Get created collection', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).get(function(err, collection){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(collection, 'New collection not returned');
        test.true(collection.slug === TEST_COLLECTION_SLUG, 'Invalid collection slug: ' + collection.slug);
        test.end();

    });

});

tap.test('Update collection', function(test){

    var json = {

        name: 'Updated Name',
        "fields": [
            {
                "type": "string",
                "name": "test_string",
            }
        ]

    };

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).put(json, function(err){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.end();

    });

});

tap.test('Check updated collection', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).get(function(err, collection){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(collection.name === 'Updated Name' && collection.fields.length == 1, 'Collection not updated');
        test.end();

    });

});

tap.test('List collection items', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().get(function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true(result.array, 'result.array is undefined');
        test.true(result.array.length === 0, 'result.array length should be 0');
        test.end();

    });

});


tap.test('Create data item 1', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().post({test_string: 'uno'}, function(err, item){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(item, 'New item not returned');
        test.true(item.id, 'New item does not have an id');
        dataItem = item;
        test.end();

    });

});

tap.test('List collection items', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().get(function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true(result.array, 'result.array is undefined');
        test.true(result.array.length === 1, 'result.array length should be 1');
        test.end();

    });

});


tap.test('Get created data item', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data(dataItem.id).get(function(err, item){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(item, 'Data item not returned');
        test.true(item.id === dataItem.id, 'Invalid data item id: ' + item.id);
        test.end();

    });

});

tap.test('Delete created data item', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data(dataItem.id).delete(function(err){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.end();

    });

});

tap.test('List collection items', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().get(function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true(result.array, 'result.array is undefined');
        test.true(result.array.length === 0, 'result.array length should be 0');
        test.end();

    });

});

tap.test('Create data item 1', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().post({test_string: 'uno'}, function(err, item){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(item, 'New item not returned');
        test.true(item.id, 'New item does not have an id');
        test.end();

    });

});

tap.test('Create data item 2', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().post({test_string: 'dos'}, function(err, item){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(item, 'New item not returned');
        test.true(item.id, 'New item does not have an id');
        test.end();

    });

});

tap.test('Create data item 3', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().post({test_string: 'dos'}, function(err, item){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(item, 'New item not returned');
        test.true(item.id, 'New item does not have an id');
        test.end();

    });

});

tap.test('List collection items', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().get(function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true(result.array, 'result.array is undefined');
        test.true(result.array.length === 3, 'result.array length should be 3');
        test.end();

    });

});


tap.test('Filter collection items', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().get({where: {test_string: 'uno'}}, function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true(result.array, 'result.array is undefined');
        test.true(result.array.length === 1, 'result.array length should be 1');
        test.end();

    });

});

tap.test('Filter collection items', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().get({where: {test_string: {$in: ['dos']}}}, function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true(result.array, 'result.array is undefined');
        test.true(result.array.length === 2, 'result.array length should be 2');
        test.end();

    });

});

tap.test('Filter collection items', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().get({where: {test_string: {$in: ['uno', 'dos']}}}, function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true(result.array, 'result.array is undefined');
        test.true(result.array.length === 3, 'result.array length should be 3');
        test.end();

    });

});

tap.test('Filter collection items', function(test){

    corus.apps(TEST_APP_SLUG).collections(TEST_COLLECTION_SLUG).data().get({where: {test_string: {$in: ['uno', 'dos']}}}, function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true(result.array, 'result.array is undefined');
        test.true(result.array.length === 3, 'result.array length should be 3');
        test.end();

    });

});

tap.test('List app users', function(test){

    corus.apps(TEST_APP_SLUG).users().get(function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true(result.array, 'result.array is undefined');
        test.true(result.array.length === 0, 'result.array length should be 0');
        test.end();

    });

});

/**
 * Users
 */

tap.test('Create user', function(test){

    corus.users().post({email: TEST_USERS_EMAIL, name:'TEST USER'}, function(err, item){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(item, 'New user not returned');
        test.true(item.id, 'New user does not have an email');
        test.end();

    });

});


tap.test('Get User', function(test){

    corus.users(TEST_USERS_EMAIL).get(function(err, result){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.true(result, 'Result is undefined');
        test.true()
        test.end();

    });

});

tap.test('Update User App Fields', function(test){

    corus.users(TEST_USERS_EMAIL).apps(TEST_APP_SLUG).put({role: 'manager'}, function(err, item){

        test.false(err, 'Error returned: ' + JSON.stringify(err));
        test.end();

    });

});

