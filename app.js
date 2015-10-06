'use strict';

var fs = require('fs');
var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());

var OAuth2 = require("oauth").OAuth2;

// configuration

var load_config = function () {
    var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    return config;
};

var save_config = function (config) {
    var text = JSON.stringify(config);
    fs.writeFileSync('config.json', text, 'utf8');
};

var config = load_config();

// prepare objects

var appUrl = "http://localhost:" + config.port;
var authPage = "/auth";
var callbackUrl = appUrl + authPage;

// based on template from
// https://github.com/ciaranj/node-oauth/blob/master/examples/github-example.js
var oauth2 = new OAuth2(
    config.appKey,
    config.appSecret,
    'https://disqus.com/',
    'api/oauth/2.0/authorize/',
    'api/oauth/2.0/access_token/',
    {
        'response_type': 'code'
    }
);

var pollInterval = 60000;

// configuration pages, for first time running of application.

app.get('/', function (req, res) {
    var authUrl = oauth2.getAuthorizeUrl({
        redirect_uri: callbackUrl,
        scope: ['read,write'],
        state: 'some random string to protect against cross-site request forgery attacks'
    });
    authUrl += "&response_type=code";

    return res.send('<h1>Please log in to Disqus</h1><p><a href="' + authUrl + '">Login</a>');
});

// does not account for hitting "deny" / etc. Assumes that
// the user has pressed "allow"
app.get(authPage, function (req, res) {

    var code = req.query.code;
    console.log(code);
    return oauth2.getOAuthAccessToken(
        code,
        {
            'redirect_uri': callbackUrl,
            'grant_type' : 'authorization_code',
            'code': code
        },
        function (e, access_token, refresh_token, results){
            if (e) {
                console.log(e);
                return res.end(JSON.stringify(e));
            } else if (results.error) {
                console.log(results);
                return res.end(JSON.stringify(results));
            }
            else {
                config.access_token = access_token;
                config.refresh_token = refresh_token;
                save_config(config);

                console.log('Obtained access-tokens: ', access_token);
                console.log('Obtained refresh-tokens: ', refresh_token);

                return res.redirect('/done');
            }
        });
});

app.get('/done', function (req, res) {
    runApp();
    res.send("Application configured and running. Restart to disable configuration interface.");
});

// actual application-logic

function errorHandler(err) {
    console.log("Error sending request to reddit:");
    console.log(err);
    console.log("Retrying later.");
    scheduleLoop();
}

function getUserName() {
    throw Error("Not implemented!");
}

function getLastCommentToKeep(user, numToKeep) {
    throw Error("Not implemented!");
}

function deleteCommentsFromEntity(comments) {
    throw Error("Not implemented!");
}

function deleteComments(user, lastKeepId) {
    throw Error("Not implemented!");
}

var user = null;

function scheduleLoop() {
    setTimeout(function () {
        runLoop();
    }, pollInterval);
}

function runLoop() {
    return getLastCommentToKeep(user, 100).then(function (lastId) {
        return deleteComments(user, lastId);
    });
}

function runApp() {
    // Print out stats about the user, that's it.
    getUserName().then(function (me) {
        user = me;
        return runLoop();
    });
}

// start configuration app-server or start app.

if (config.refresh_token === undefined) {
    app.listen(config.port, function () {
        console.log('Please go to the following URL to configure the app: ' + appUrl);
    });
} else {
    oauth2.getOAuthAccessToken(
        config.refresh_token,
        {
            'redirect_uri': callbackUrl,
            'grant_type' : 'refresh_token',
            'code': config.refresh_token
        },
        function (e, access_token, refresh_token, results){
            if (e) {
                console.log(e);
            } else if (results.error) {
                console.log(results);
            } else {
                config.access_token = access_token;
                save_config(config);

                console.log('Obtained access-tokens: ', access_token);

                runApp();
            }
        });
}
