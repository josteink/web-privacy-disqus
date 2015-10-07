
var disqus = function(appKey, appSecret, callbackUrl) {

    var req = require("request");

    var self = this;
    self.refreshToken = null;
    self.accessToken = null;

    self.getAuthUrl = function() {
        var result = "https://disqus.com/api/oauth/2.0/authorize/"
            + "?client_id=" + appKey
            + "&scope=read,write"
            + "&response_type=code"
            + "&redirect_uri=" + callbackUrl;
        return result;
    };

    var handleAuthenticationResult = function(error, response, body)
    {
        var errorCarrier = {
            error: error,
            response: response,
            body: body
        };
        if (error) {
            throw Error(errorCarrier);
        }

        var obj = JSON.parse(body);
        errorCarrier.object = obj;

        if (obj.error)
        {
            throw Error(errorCarrier);
        }

        // requesting new access-token invalidates previous
        // refresh token so we must save the new one!
        self.refreshToken = obj.refresh_token;
        self.accessToken = obj.access_token;

        // save information useful for api-access
        self.user = {
            id: obj.user_id,
            name: obj.username
        };
    };

    self.getTokensFromCode = function(code, callback) {
        // TODO: create inner callback which parses contents and stores
        // access_token and refresh_token.
        return req.post("https://disqus.com/api/oauth/2.0/access_token/", {
            form: {
                "grant_type": "authorization_code",
                "client_id": appKey,
                "client_secret": appSecret,
                "redirect_uri": callbackUrl,
                "code": code
            }
        }, function(error, response, body) {
            handleAuthenticationResult(error, response, body);
            callback(self.refreshToken);
        });
    };

    self.refresh = function(refreshToken, callback) {
        if (callback === null || callback === undefined) {
            callback = refreshToken;
            refreshToken = self.refreshToken;
        }

        return req.post("https://disqus.com/api/oauth/2.0/access_token/", {
            form: {
                "grant_type": "refresh_token",
                "client_id": appKey,
                "client_secret": appSecret,
                "refresh_token": refreshToken
            }
        }, function(error, response, body) {
            handleAuthenticationResult(error, response, body);
            callback(self.refreshToken);
        });
    };

    self.getUserName = function() {
        return {
            then: function(callback) {
                callback(self.user.name);
            }

        };;

    };

    self.get = function(url, options, callback) {
        // TODO: wrap req.get with auth-headers
    };

    self.post = function(url, options, callback) {
        // TODO: wrap req.post with auth-headers
    };
};

exports.disqus = disqus;
