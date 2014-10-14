express = require 'express'
engines = require 'consolidate'

_ = require 'lodash'

connections = []
currentServer = null

_removeFromConnections = (id) ->
  connections = connections.filter (conn) -> conn._id isnt id

exports.start = (config, options, done) ->
  config.log.debug "Setting up default express server"

  app = express()
  options.userServer = currentServer = app.listen config.server.port, =>
    config.log.success "Mimosa's bundled Express started at [[ http://localhost:#{config.server.port}#{config.server.base} ]]"
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
      pretty:    true

    _.extend(options, config.server.views.options)

    if config.server.defaultServer.onePager
      app.get '*/?', (req, res) -> res.render 'index', options
    else
      app.get '/', (req, res) -> res.render 'index', options
      app.get '/:viewname*/?', (req, res) ->
        try
          res.render req.params.viewname, options, (err, html) ->
            if err
              config.log.warn "Sending 404 for URL [[ #{req.url} ]], ", err
              res.send 404, "Could not find #{req.params.viewname}"
            else
              res.send html
        catch err
          res.send 404, "Could not find #{req.params.viewname}"