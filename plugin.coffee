"use strict"

fs =      require 'fs'

express = require 'express'
_ =       require 'lodash'
engines = require 'consolidate'
logger  = require 'logmimosa'

currentServer = null
connections = []

registration = (config, register) ->
    return unless config.isServer
    register ['postBuild'], 'server', _startServer

startProvidedServer = (config, options, done) ->
  if currentServer?
    __cleanUpConnections()
    currentServer.close ->
      _startProvidedServer config, options, done
  else
    _startProvidedServer config, options, done

_startServer = (config, options, next) ->
  if (config.server.useDefaultServer)
    _startDefaultServer(config, options, next)
  else
    startProvidedServer(config, options, next)

__cleanUpConnections = ->
  conn.connection.destroy() for conn in connections
  connections = []

_startDefaultServer = (config, options, done) ->
  logger.debug "Setting up default express server"

  app = express()
  options.userServer = currentServer = app.listen config.server.port, =>
    logger.success "Mimosa's bundled Express started at http://localhost:#{config.server.port}#{config.server.base}"
    done()

  currentServer.on 'request', (request, response) ->
    connections.push request

  app.configure =>
    app.set 'port', config.server.port
    app.set 'views', config.server.views.path
    app.engine config.server.views.extension, engines[config.server.views.compileWith]
    app.set 'view engine', config.server.views.extension
    app.use express.bodyParser()
    app.use express.methodOverride()
    app.use (req, res, next) ->
      res.header 'Cache-Control', 'no-cache'
      next()
    app.use express.compress()
    app.use express.static(config.watch.compiledDir)
    app.use config.server.base, app.router

  if config.server.views.html
    name = if config.isOptimize
      'index-optimize'
    else
      'index'
    app.get '/*', (req, res) -> res.render name
  else
    useReload = if config.liveReload?.enabled? then config.liveReload.enabled
    options =
      reload:    useReload
      optimize:  config.isOptimize ? false
      cachebust: if process.env.NODE_ENV isnt "production" then "?b=#{(new Date()).getTime()}" else ''

    logger.debug "Options for index:\n#{JSON.stringify(options, null, 2)}"

    # TODO, consider a configurable object of, action/url/viewname
    app.get '/*', (req, res) -> res.render 'index', options

_startProvidedServer = (config, options, done) ->
  fs.exists config.server.path, (exists) =>
    if exists
      server = require config.server.path
      if server.startServer
        logger.success "Mimosa is starting your server: #{config.server.path}"
        conf = _.extend({}, config)
        server.startServer conf, (userServer, socketio) ->
          if userServer
            options.userServer = currentServer = userServer
            currentServer.on 'request', (request, response) ->
              connections.push request
          else
            logger.error "A server was not provided when the startServer callback was executed"

          if socketio
            options.socketio = socketio

          done()
      else
        logger.error "Found provided server located at #{config.server.path} (#{serverPath}) but it does not contain a 'startServer' function."
        done()
    else
      logger.error "Attempted to start the provided server located at #{config.server.path} (#{serverPath}), but could not find it."
      done()


module.exports =
  registration: registration
  startServer:  startProvidedServer