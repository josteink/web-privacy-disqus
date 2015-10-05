
# web-privacy-disqus

Protect your privacy by regularly cleaning your deep comment-history
on sites like disqus.

Most comments only have temporal value for a discussion going on now,
in a thread which will be forgotten and abandoned by next week.

It's extremely easy to slip out just a single link or piece of
information which can be used to identify you, or your employer,
without even noticing.

If you maintain your deep comment history, you are almost guaranteed
to be identifiable in some way to someone determined enough to dig.

This tool aims to limit that ability by cleaning older posts from an
account's history which probably no longer holds any value.

This is a simple module/experiment written in NodeJS to see how that
works out. Depending on how it turns out it may become a part of a bigger suite
of web-privacy related tools (Facebook, Reddit, etc)

## Features

* Automatically delete old-posts

### Planned features

* Gui configuration (by count, by age, etc)
* Save posts before deleting

## Dependencies

This project depends on

* NodeJS
* npm

It's currently in development and not functional.

Install these dependencies using your favourite package-manager:

````bash
sudo apt-get install nodejs npm
````

## Using

Ambition is to be fully self explenatory, maybe even as a SaaS.

Current status is that you need to download it, configure it and
run it yourself.

To prepare it, do the following:

* Register a [disqus API client](https://disqus.com/api/applications/)
  and take note of app-id and app-secret. Set application url to
  http://localhost:8800/ and then the callback URL to
  http://localhost:8800/auth
* Execute the following bash-snippets

````bash
# clone repo
git clone https://github.com/josteink/web-privacy-disqus
cd web-privacy-disqus

# restore package-dependencies
npm install

# insert your app-id and app-secret here
nano config.json

# run application
node index.js
````

After that, the application should be running in a unconfigured
state. To complete the configuration-process, the application will
tell you to visit a web-page:
[http://localhost:8800/](http://localhost:8800/).

Go there with a browser and follow the instructions.

Once configured, the application will start. Next time you start it,
the authentication-data will be restored from disk and the
configuration interface will not be started nor needed.

**Note:** Port can be changed in `config.json`, if already occupied by
other software. Make sure to update your application-registration accordingly.
