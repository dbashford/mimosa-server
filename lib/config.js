"use strict";
var fs, path;

fs = require('fs');

path = require('path');

exports.defaults = function() {
  return {
    server: {
      defaultServer: {
        enabled: false,
        onePager: false
      },
      path: 'server.coffee',
      port: 3000,
      base: '',
      views: {
        compileWith: 'jade',
        extension: 'jade',
        path: 'views'
      }
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  # server:                      # configuration for server when server option is enabled via CLI\n    # defaultServer:\n      # enabled: false           # whether or not mimosa starts a default server for you, when\n                                 # true, mimosa starts its own on the port below, when false,\n                                 # Mimosa will use server provided by path below\n      # onePager: false          # Whether or not your app is a one page application. When set to\n                                 # true, all routes will be pointed at index\n    # path: 'server.coffee'      # valid when defaultServer.enabled: false, path to file for provided\n                                 # server which must contain export startServer method that takes\n                                 # an enriched mimosa-config object\n    # port: 3000                 # port to start server on\n    # base: ''                   # base of url for the app, if altered should start with a slash\n    # views:                     # configuration for the view layer of your application\n      # compileWith: 'jade'      # Valid options: \"jade\", \"hogan\", \"html\", \"ejs\", \"handlebars\".\n                                 # The compiler for your views.\n      # extension: 'jade'        # extension of your server views\n      # path: 'views'            # This is the path to project views, it can be absolute or\n                                 # relative. If defaultServer.enabled is true, it is relative to the\n                                 # root of the project. If defaultServer.enabled is false it is\n                                 # relative to the server.path setting above.";
};

exports.validate = function(config, validators) {
  var errors, viewsRelativeTo;

  errors = [];
  if (validators.ifExistsIsObject(errors, "server config", config.server)) {
    validators.ifExistsIsBoolean(errors, "server.defaultServer.enabled", config.server.defaultServer.enabled);
    validators.ifExistsIsBoolean(errors, "server.defaultServer.onePager", config.server.defaultServer.onePager);
    validators.ifExistsIsString(errors, "server.path", config.server.path);
    validators.ifExistsIsNumber(errors, "server.port", config.server.port);
    validators.ifExistsIsString(errors, "server.base", config.server.base);
    if (validators.ifExistsIsObject(errors, "server.views", config.server.views)) {
      if (validators.ifExistsIsString(errors, "server.views.compileWith", config.server.views.compileWith)) {
        if (!(["jade", "hogan", "html", "ejs", "handlebars"].indexOf(config.server.views.compileWith) > -1)) {
          errors.push("server.views.compileWith must be one of the following: jade, hogan, html, ejs, handlebars.");
        }
      }
      validators.ifExistsIsString(errors, "server.views.extension", config.server.views.extension);
      validators.ifExistsIsString(errors, "server.views.path", config.server.views.path);
    }
  }
  if (errors.length === 0) {
    if (config.server.views.compileWith === "html") {
      config.server.views.compileWith = "ejs";
      config.server.views.html = true;
    }
    config.server.path = validators.determinePath(config.server.path, config.root);
    viewsRelativeTo = config.server.defaultServer.enabled ? config.root : path.dirname(config.server.path);
    config.server.views.path = validators.determinePath(config.server.views.path, viewsRelativeTo);
    if (config.isServer) {
      if (!fs.existsSync(config.server.views.path)) {
        errors.push("server.views.path [[ " + config.server.views.path + ") ]] cannot be found");
      } else if (fs.statSync(config.server.views.path).isFile()) {
        errors.push("server.views.path [[ " + config.server.views.path + " ]] cannot be found, expecting a directory and is a file");
      }
      if (!config.server.defaultServer.enabled) {
        if (!fs.existsSync(config.server.path)) {
          errors.push("server.path [[ " + config.server.path + ") ]] cannot be found");
        } else if (fs.statSync(config.server.path).isDirectory()) {
          errors.push("server.path [[ " + config.server.path + " ]] cannot be found, expecting a file and is a directory");
        }
      }
    }
  }
  return errors;
};
