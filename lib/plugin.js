"use strict";
var connections, currentServer, engines, express, fs, logger, registration, startProvidedServer, _, __cleanUpConnections, _removeFromConnections, _startDefaultServer, _startProvidedServer, _startServer;

fs = require('fs');

express = require('express');

_ = require('lodash');

engines = require('consolidate');

logger = require('logmimosa');

currentServer = null;

connections = [];

registration = function(config, register) {
  if (!config.isServer) {
    return;
  }
  return register(['postBuild'], 'server', _startServer);
};

startProvidedServer = function(config, options, done) {
  if (currentServer != null) {
    __cleanUpConnections();
    return currentServer.close(function() {
      return _startProvidedServer(config, options, done);
    });
  } else {
    return _startProvidedServer(config, options, done);
  }
};

_startServer = function(config, options, next) {
  if (config.server.defaultServer.enabled) {
    return _startDefaultServer(config, options, next);
  } else {
    return startProvidedServer(config, options, next);
  }
};

__cleanUpConnections = function() {
  var conn, _i, _len;
  for (_i = 0, _len = connections.length; _i < _len; _i++) {
    conn = connections[_i];
    conn.destroy();
  }
  return connections = [];
};

_startDefaultServer = function(config, options, done) {
  var app, indexName, useReload, _ref, _ref1,
    _this = this;
  logger.debug("Setting up default express server");
  app = express();
  options.userServer = currentServer = app.listen(config.server.port, function() {
    logger.success("Mimosa's bundled Express started at http://localhost:" + config.server.port + config.server.base);
    return done();
  });
  currentServer.on('connection', function(conn) {
    conn._id = new Date().getTime();
    conn.on('close', function() {
      return _removeFromConnections(conn._id);
    });
    return connections.push(conn);
  });
  app.configure(function() {
    app.set('port', config.server.port);
    app.set('views', config.server.views.path);
    app.engine(config.server.views.extension, engines[config.server.views.compileWith]);
    app.set('view engine', config.server.views.extension);
    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(function(req, res, next) {
      res.header('Cache-Control', 'no-cache');
      return next();
    });
    app.use(express.compress());
    app.use(express["static"](config.watch.compiledDir));
    return app.use(config.server.base, app.router);
  });
  if (config.server.views.html) {
    indexName = config.isOptimize ? 'index-optimize' : 'index';
    if (config.server.defaultServer.onePager) {
      return app.get('*/?', function(req, res) {
        return res.render(indexName);
      });
    } else {
      app.get('/', function(req, res) {
        return res.render(indexName);
      });
      return app.get('/:viewname*/?', function(req, res) {
        var viewName;
        viewName = req.params.viewname;
        if (config.isOptimize) {
          viewName += "-optimize";
        }
        return res.render(viewName);
      });
    }
  } else {
    useReload = ((_ref = config.liveReload) != null ? _ref.enabled : void 0) != null ? config.liveReload.enabled : void 0;
    options = {
      reload: useReload,
      optimize: (_ref1 = config.isOptimize) != null ? _ref1 : false,
      cachebust: process.env.NODE_ENV !== "production" ? "?b=" + ((new Date()).getTime()) : ''
    };
    if (config.server.defaultServer.onePager) {
      return app.get('*/?', function(req, res) {
        return res.render('index', options);
      });
    } else {
      app.get('/', function(req, res) {
        return res.render('index', options);
      });
      return app.get('/:viewname*/?', function(req, res) {
        return res.render(req.params.viewname, options, function(err, html) {
          if (err) {
            logger.warn("404", err);
            return res.send(404, "Could not find " + req.params.viewname);
          } else {
            return res.send(html);
          }
        });
      });
    }
  }
};

_startProvidedServer = function(config, options, done) {
  var _this = this;
  return fs.exists(config.server.path, function(exists) {
    var conf, server;
    if (exists) {
      server = require(config.server.path);
      if (server.startServer) {
        logger.success("Mimosa is starting your server: " + config.server.path);
        conf = _.extend({}, config);
        return server.startServer(conf, function(userServer, socketio) {
          if (userServer) {
            options.userServer = currentServer = userServer;
            currentServer.on('connection', function(conn) {
              conn._id = new Date().getTime();
              conn.on('close', function() {
                return _removeFromConnections(conn._id);
              });
              return connections.push(conn);
            });
          } else {
            logger.error("A server was not provided when the startServer callback was executed");
          }
          if (socketio) {
            options.socketio = socketio;
          }
          return done();
        });
      } else {
        logger.error("Found provided server located at " + config.server.path + " but it does not contain a 'startServer' function.");
        return done();
      }
    } else {
      logger.error("Attempted to start the provided server located at " + config.server.path + ", but could not find it.");
      return done();
    }
  });
};

_removeFromConnections = function(id) {
  return connections = connections.filter(function(conn) {
    return conn._id !== id;
  });
};

module.exports = {
  registration: registration,
  startServer: startProvidedServer
};
