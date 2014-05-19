"use strict";
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
      packageJSONDir: null,
      views: {
        compileWith: 'jade',
        extension: 'jade',
        path: 'views',
        options: {}
      }
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  server:                      # configuration for server when server option is enabled via CLI\n    defaultServer:\n      enabled: false           # whether or not mimosa starts a default server for you, when\n                               # true, mimosa starts its own on the port below, when false,\n                               # Mimosa will use server provided by path below\n      onePager: false          # Whether or not your app is a one page application. When set to\n                               # true, all routes will be pointed at index\n    path: 'server.coffee' or 'server.js'  # valid when defaultServer.enabled: false, path to file\n                               # for provided server which must contain export startServer method\n                               # that takes an enriched mimosa-config object. Either server.coffee\n                               # or server.js files will be found and used by default.\n    packageJSONDir: null       # If using own server, not default server, this is the location of\n                               # project's package.json. Defaults to location of mimosa-config.\n    port: 3000                 # port to start server on\n    base: ''                   # base of url for the app, if altered should start with a slash\n    views:                     # configuration for the view layer of your application\n      compileWith: 'jade'      # Valid options: \"jade\", \"hogan\", \"html\", \"ejs\", \"handlebars\", \"dust\".\n                               # The compiler for your views.\n      extension: 'jade'        # extension of your server views\n      path: 'views'            # This is the path to project views, it can be absolute or\n                               # relative. If defaultServer.enabled is true, it is relative to the\n                               # root of the project. If defaultServer.enabled is false it is\n                               # relative to the server.path setting above.\n      options:{}               # Options to pass to any views being served by Mimosa's default\n                               # server.";
};

exports.validate = function(config, validators) {
  var errors, fs, path, serverPathExt, tempServerPath, viewsRelativeTo, _ref;
  fs = require('fs');
  path = require('path');
  errors = [];
  if (validators.ifExistsIsObject(errors, "server config", config.server)) {
    validators.ifExistsIsBoolean(errors, "server.defaultServer.enabled", config.server.defaultServer.enabled);
    validators.ifExistsIsBoolean(errors, "server.defaultServer.onePager", config.server.defaultServer.onePager);
    validators.ifExistsIsString(errors, "server.path", config.server.path);
    validators.ifExistsIsString(errors, "server.packageJSONDir", config.server.packageJSONDir);
    validators.ifExistsIsNumber(errors, "server.port", config.server.port);
    validators.ifExistsIsString(errors, "server.base", config.server.base);
    if (validators.ifExistsIsObject(errors, "server.views", config.server.views)) {
      validators.ifExistsIsObject(errors, "server.views.options", config.server.views.options);
      if (validators.ifExistsIsString(errors, "server.views.compileWith", config.server.views.compileWith)) {
        if (!(["jade", "hogan", "html", "ejs", "handlebars", "dust"].indexOf(config.server.views.compileWith) > -1)) {
          errors.push("server.views.compileWith must be one of the following: jade, hogan, html, ejs, handlebars, dust.");
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
          serverPathExt = path.extname(config.server.path);
          if (serverPathExt === ".coffee") {
            tempServerPath = config.server.path.replace(/.coffee$/, ".js");
            if (fs.existsSync(tempServerPath)) {
              config.server.path = tempServerPath;
            } else {
              errors.push("server.path [[ " + config.server.path + ") ]] cannot be found");
            }
          } else {
            errors.push("server.path [[ " + config.server.path + ") ]] cannot be found");
          }
        } else if (fs.statSync(config.server.path).isDirectory()) {
          errors.push("server.path [[ " + config.server.path + " ]] cannot be found, expecting a file and is a directory");
        }
        config.server.packageJSONDir = validators.determinePath((_ref = config.server.packageJSONDir) != null ? _ref : config.root, config.root);
        config.server.packageJSONDir = path.join(config.server.packageJSONDir, "package.json");
        if (fs.existsSync(config.server.packageJSONDir)) {
          config.server.packageJSON = require(config.server.packageJSONDir);
        } else {
          errors.push("server.packageJSONDir [[ " + config.server.packageJSONDir + ") ]] cannot be found");
        }
      }
    }
  }
  if (errors.length === 0 && !config.isServer) {
    if (!fs.existsSync(config.server.path)) {
      serverPathExt = path.extname(config.server.path);
      if (serverPathExt === ".coffee") {
        tempServerPath = config.server.path.replace(/.coffee$/, ".js");
        if (fs.existsSync(tempServerPath)) {
          config.server.path = tempServerPath;
        }
      }
    }
  }
  return errors;
};
