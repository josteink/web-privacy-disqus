
var disqus = function(appKey, appSecret, callbackUrl) {

    var self = this;
    var req = require("request");
    // req.get("http://example.org", function (error, response, body) {
    //     console.log(error);
    //     console.log(response);
    //     console.log(body);
    // });

    self.getAuthUrl = function() {
        var result = "https://disqus.com/api/oauth/2.0/authorize/"
            + "?client_id=" + appKey
            + "&scope=read,write"
            + "&response_type=code"
            + "&redirect_uri=" + callbackUrl;
        return result;
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
        }, callback);
    };

    self.refresh = function(refreshToken, callback) {
        // TODO: create inner callback which parses contents and stores
        // access_token and refresh_token.
        return req.post("https://disqus.com/api/oauth/2.0/access_token/", {
            form: {
                "grant_type": "refresh_token",
                "client_id": appKey,
                "client_secret": appSecret,
                "refresh_token": refreshToken
            }
        }, callback);
    };

    self.get = function(url, options, callback) {
        // TODO: wrap req.get with auth-headers
    };

    self.post = function(url, options, callback) {
        // TODO: wrap req.post with auth-headers
    };
};

exports.disqus = disqus;
