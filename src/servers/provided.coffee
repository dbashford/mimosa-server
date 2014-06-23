fs = require 'fs'
path = require 'path'

_ = require 'lodash'

connections = []
currentServer = null
transpilers = ["coffee-script", "iced-coffee-script", "LiveScript", "coco"]

_cleanUpConnections = ->
  for conn in connections
    conn.destroy()
  connections = []

_removeFromConnections = (id) ->
  connections = connections.filter (conn) -> conn._id isnt id

_startProvidedServer = (config, options, done) ->
  if config.server.packageJSON?.dependencies?
    deps = Object.keys(config.server.packageJSON.dependencies)
    _.intersection(deps, transpilers).forEach (transpiler) ->
      if config.log.debug and config.log.isDebug()
        config.log.debug transpiler, "being required in by mimosa-server"

      transp = require(path.join config.root, "node_modules", transpiler)
      if transp.register
        transp.register()

  fs.exists config.server.path, (exists) =>
    if exists
      server = require config.server.path
      if server.startServer
        config.server.userServerFile = server
        config.log.success "Mimosa is starting your server: [[ #{config.server.path} ]]"
        conf = _.extend({}, config)
        server.startServer conf, (userServer, socketio) ->
          if userServer
            config.server.userServerObject = options.userServer = currentServer = userServer
            currentServer.on 'connection', (conn) ->
              conn._id = new Date().getTime()
              conn.on 'close', ->
                _removeFromConnections conn._id
              connections.push conn

            # listen for call to stop mimosa
            process.on 'STOPMIMOSA', ->
              currentServer.close()
          else
            config.log.error "A server was not provided when the startServer callback was executed"

          if socketio
            options.socketio = socketio

          done()
      else
        config.log.error "Found provided server located at [[ #{config.server.path} ]] but it does not contain a 'startServer' function."
        done()
    else
      config.log.error "Attempted to start the provided server located at [[ #{config.server.path} ]], but could not find it."
      done()

exports.start = (config, options, done) ->
  if currentServer
    _cleanUpConnections()
    currentServer.close ->
      _startProvidedServer config, options, done
  else
    _startProvidedServer config, options, done