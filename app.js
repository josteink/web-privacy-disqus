'use strict';

var fs = require('fs');
var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());

var OAuth2 = require("oauth").OAuth2;

// configuration

var Config = require("./config").config;
var configProvider = new Config("config.json", {
    "appKey":"--your appKey here--",
    "appSecret":"--your appSecret here--",
    "port":8800
});
var config = configProvider.load();

// prepare objects

var appUrl = "http://localhost:" + config.port;
var authPage = "/auth";
var callbackUrl = appUrl + authPage;

var Disqus = require("./oauth-disqus").disqus;
var disqus = new Disqus(config.appKey,config.appSecret,callbackUrl);

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
    var authUrl = disqus.getAuthUrl();
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
                configProvider.save(config);

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
    disqus.refresh(config.refresh_token,
                   function (error, response, body) {
                       if (error) {
                           console.log(error);
                       } else {
                           var obj = JSON.parse(body);
                           console.log(obj);
                           if (!obj.error)
                           {
                               // requesting new access-token invalidates previous
                               // refresh token so we must save the new one!
                               config.refresh_token = obj.refresh_token;
                               config.access_token = obj.access_token;
                               configProvider.save(config);
                               
                               runApp();
                           }
                       }
                   });
}
