"use strict"

_startServer = (config, options, next) ->
  if (config.server.defaultServer.enabled)
    require("./servers/default").start(config, options, next)
  else
    require("./servers/provided").start(config, options, next)

startProvidedServer = (config, options, next) ->
  require("./servers/provided").start(config, options, next)

registration = (config, register) ->
  return unless config.isServer
  register ['postBuild'], 'server', _startServer

module.exports =
  registration: registration
  startServer:  startProvidedServer