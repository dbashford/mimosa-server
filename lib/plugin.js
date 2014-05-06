"use strict";
var registration, startProvidedServer, _startServer;

_startServer = function(config, options, next) {
  if (config.server.defaultServer.enabled) {
    return require("./servers/default").start(config, options, next);
  } else {
    return require("./servers/provided").start(config, options, next);
  }
};

startProvidedServer = function(config, options, next) {
  return require("./servers/provided").start(config, options, next);
};

registration = function(config, register) {
  if (!config.isServer) {
    return;
  }
  return register(['postBuild'], 'server', _startServer);
};

module.exports = {
  registration: registration,
  startServer: startProvidedServer
};
