/* jshint node: true */
'use strict';

var fs = require('fs');
var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());

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
    return disqus.getTokensFromCode(code, combine(handleAuthResult, function() {
        res.redirect("/done");
    }));
});

app.get('/done', function (req, res) {
    runApp();
    res.send("Application configured and running. Restart to disable configuration interface.");
});

// actual application-logic

function handleAuthResult(refreshToken) {
    // requesting new access-token invalidates previous
    // refresh token so we must save the new one!
    config.refresh_token = refreshToken;
    configProvider.save(config);

    // we should always start the main app-loop once authenticated
    runApp();
}

function combine(f1, f2) {
    return function() {
        f1.apply(f1, arguments);
        f2.apply(f2, arguments);
    };
}

function errorHandler(err) {
    console.log("Error sending request to disqus:");
    console.log(err);
    console.log("Retrying later.");
    scheduleLoop();
}

function getCursorToDeletion(user, numToKeep, callback) {
    // list of comments here https://disqus.com/api/3.0/users/listPosts.json
    // docs here: https://disqus.com/api/docs/users/listPosts/

    var url = "https://disqus.com/api/3.0/users/listPosts.json?limit=" + numToKeep;
    disqus.get(url, function(res) {
        if (!res.cursor.hasNext) {
            // no comments to delete.
            scheduleLoop();
        } else  {
            console.log("Num posts retrieved: " + res.response.length);
            callback(res.cursor.next);
        }
    });
}

function getPostsToDelete(user, numToKeep, callback) {
    // list of comments here https://disqus.com/api/3.0/users/listPosts.json
    // docs here: https://disqus.com/api/docs/users/listPosts/

    getCursorToDeletion(user, numToKeep, function(cursor) {
        var e_cursor = encodeURIComponent(cursor);
        var url = "https://disqus.com/api/3.0/users/listPosts.json?limit=" + numToKeep + "&cursor=" + e_cursor;
        disqus.get(url, function(res) {
            if (!res.cursor.hasNext) {
                // no comments to delete.
                scheduleLoop();
            } else  {
                callback(res.response);
            }
        });
    });
}

function deleteComments(user, numToKeep) {
    // https://disqus.com/api/docs/posts/remove/
    getPostsToDelete(user, numToKeep, function(posts) {
        var postParams = posts.map(function(i) { return "post=" + i.id; });
        var query = postParams.reduce(function(s,i) {
            return s + "&" + i;
        });
        var url = "https://disqus.com/api/3.0/posts/remove.json?" + query;
        disqus.post(url, function(res) {
            console.log("Number of posts deleted: " + res.response.length);
            scheduleLoop(1000);
        });
    });
}

var user = null;

function scheduleLoop(interval) {
    if (!interval) {
        interval = pollInterval;
    }
    setTimeout(function () {
        runLoop();
    }, interval);
}

function runLoop() {
    return deleteComments(user, 10);
}

function runApp() {
    // Print out stats about the user, that's it.
    disqus.getUserName().then(function (me) {
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
    disqus.refresh(config.refresh_token, handleAuthResult);
}
