var connections, currentServer, fs, path, transpilers, _, _cleanUpConnections, _removeFromConnections, _startProvidedServer;

fs = require('fs');

path = require('path');

_ = require('lodash');

connections = [];

currentServer = null;

transpilers = ["coffee-script", "iced-coffee-script", "LiveScript", "coco"];

_cleanUpConnections = function() {
  var conn, _i, _len;
  for (_i = 0, _len = connections.length; _i < _len; _i++) {
    conn = connections[_i];
    conn.destroy();
  }
  return connections = [];
};

_removeFromConnections = function(id) {
  return connections = connections.filter(function(conn) {
    return conn._id !== id;
  });
};

_startProvidedServer = function(config, options, done) {
  var deps, _ref;
  if (((_ref = config.server.packageJSON) != null ? _ref.dependencies : void 0) != null) {
    deps = Object.keys(config.server.packageJSON.dependencies);
    _.intersection(deps, transpilers).forEach(function(transpiler) {
      var transp;
      if (config.log.debug && config.log.isDebug()) {
        config.log.debug(transpiler, "being required in by mimosa-server");
      }
      transp = require(path.join(config.root, "node_modules", transpiler));
      if (transp.register) {
        return transp.register();
      }
    });
  }
  return fs.exists(config.server.path, (function(_this) {
    return function(exists) {
      var conf, server;
      if (exists) {
        server = require(config.server.path);
        if (server.startServer) {
          config.server.userServerFile = server;
          config.log.success("Mimosa is starting your server: [[ " + config.server.path + " ]]");
          conf = _.extend({}, config);
          return server.startServer(conf, function(userServer, socketio) {
            if (userServer) {
              config.server.userServerObject = options.userServer = currentServer = userServer;
              currentServer.on('connection', function(conn) {
                conn._id = new Date().getTime();
                conn.on('close', function() {
                  return _removeFromConnections(conn._id);
                });
                return connections.push(conn);
              });
              process.on('STOPMIMOSA', function() {
                return currentServer.close();
              });
            } else {
              config.log.error("A server was not provided when the startServer callback was executed");
            }
            if (socketio) {
              options.socketio = socketio;
            }
            return done();
          });
        } else {
          config.log.error("Found provided server located at [[ " + config.server.path + " ]] but it does not contain a 'startServer' function.");
          return done();
        }
      } else {
        config.log.error("Attempted to start the provided server located at [[ " + config.server.path + " ]], but could not find it.");
        return done();
      }
    };
  })(this));
};

exports.start = function(config, options, done) {
  if (currentServer) {
    _cleanUpConnections();
    return process.nextTick(function() {
      return currentServer.close(function() {
        return _startProvidedServer(config, options, done);
      });
    });
  } else {
    return _startProvidedServer(config, options, done);
  }
};
