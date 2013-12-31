"use strict"

fs =      require 'fs'

express = require 'express'
_ =       require 'lodash'
engines = require 'consolidate'
logger  = require 'logmimosa'

currentServer = null
connections = []

transpilers = ["coffee-script", "iced-coffee-script", "LiveScript", "coco"]

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
  if (config.server.defaultServer.enabled)
    _startDefaultServer(config, options, next)
  else
    startProvidedServer(config, options, next)

__cleanUpConnections = ->
  for conn in connections
    conn.destroy()
  connections = []

_startDefaultServer = (config, options, done) ->
  logger.debug "Setting up default express server"

  app = express()
  options.userServer = currentServer = app.listen config.server.port, =>
    logger.success "Mimosa's bundled Express started at http://localhost:#{config.server.port}#{config.server.base}"
    done()

  currentServer.on 'connection', (conn) ->
    conn._id = new Date().getTime()
    conn.on 'close', ->
      _removeFromConnections conn._id
    connections.push conn

  app.configure =>
    app.set 'port', config.server.port
    app.set 'views', config.server.views.path
    app.engine config.server.views.extension, engines[config.server.views.compileWith]
    app.set 'view engine', config.server.views.extension
    app.use express.favicon()
    app.use express.urlencoded()
    app.use express.json()
    app.use express.methodOverride()
    app.use (req, res, next) ->
      res.header 'Cache-Control', 'no-cache'
      next()
    app.use express.compress()
    app.use express.static(config.watch.compiledDir)
    app.use config.server.base, app.router

  if config.server.views.html
    indexName = if config.isOptimize
      'index-optimize'
    else
      'index'
    if config.server.defaultServer.onePager
      app.get '*/?', (req, res) -> res.render indexName
    else
      app.get '/', (req, res) -> res.render indexName
      app.get '/:viewname*/?', (req, res) ->
        viewName = req.params.viewname
        if config.isOptimize
          viewName += "-optimize"
        res.render viewName
  else
    useReload = if config.liveReload?.enabled? then config.liveReload.enabled
    options =
      reload:    useReload
      optimize:  config.isOptimize ? false
      cachebust: if process.env.NODE_ENV isnt "production" then "?b=#{(new Date()).getTime()}" else ''

    if config.server.defaultServer.onePager
      app.get '*/?', (req, res) -> res.render 'index', options
    else
      app.get '/', (req, res) -> res.render 'index', options
      app.get '/:viewname*/?', (req, res) ->
        try
          res.render req.params.viewname, options, (err, html) ->
            if err
              logger.warn "Sending 404 for URL [[ #{req.url} ]], ", err
              res.send 404, "Could not find #{req.params.viewname}"
            else
              res.send html
        catch err
          res.send 404, "Could not find #{req.params.viewname}"

_startProvidedServer = (config, options, done) ->
  if config.server.packageJSON?.dependencies?
    deps = Object.keys(config.server.packageJSON.dependencies)
    if logger.debug
      logger.debug _.intersection(deps, transpilers), "being required in by mimosa-server"
    _.intersection(deps, transpilers).forEach (transpiler) ->
      transp = require transpiler
      if transp.register
        transp.register()

  fs.exists config.server.path, (exists) =>
    if exists
      server = require config.server.path
      if server.startServer
        logger.success "Mimosa is starting your server: #{config.server.path}"
        conf = _.extend({}, config)
        server.startServer conf, (userServer, socketio) ->
          if userServer
            options.userServer = currentServer = userServer
            currentServer.on 'connection', (conn) ->
              conn._id = new Date().getTime()
              conn.on 'close', ->
                _removeFromConnections conn._id
              connections.push conn
          else
            logger.error "A server was not provided when the startServer callback was executed"

          if socketio
            options.socketio = socketio

          done()
      else
        logger.error "Found provided server located at #{config.server.path} but it does not contain a 'startServer' function."
        done()
    else
      logger.error "Attempted to start the provided server located at #{config.server.path}, but could not find it."
      done()

_removeFromConnections = (id) ->
  connections = connections.filter (conn) -> conn._id isnt id

module.exports =
  registration: registration
  startServer:  startProvidedServer