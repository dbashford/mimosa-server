"use strict"

fs   = require 'fs'
path = require 'path'

exports.defaults = ->
  server:
    defaultServer:
      enabled: false
      onePager: false
    path: 'server.coffee'
    port: 3000
    base: ''
    packageJSONDir: null
    views:
      compileWith: 'jade'
      extension: 'jade'
      path: 'views'

exports.placeholder = ->
  """
  \t

    # server:                      # configuration for server when server option is enabled via CLI
      # defaultServer:
        # enabled: false           # whether or not mimosa starts a default server for you, when
                                   # true, mimosa starts its own on the port below, when false,
                                   # Mimosa will use server provided by path below
        # onePager: false          # Whether or not your app is a one page application. When set to
                                   # true, all routes will be pointed at index
      # path: 'server.coffee'      # valid when defaultServer.enabled: false, path to file for provided
                                   # server which must contain export startServer method that takes
                                   # an enriched mimosa-config object
      # packageJSONDir: null       # If using own server, not default server, this is the location of
                                   # project's package.json. Defaults to location of mimosa-config.
      # port: 3000                 # port to start server on
      # base: ''                   # base of url for the app, if altered should start with a slash
      # views:                     # configuration for the view layer of your application
        # compileWith: 'jade'      # Valid options: "jade", "hogan", "html", "ejs", "handlebars", "dust".
                                   # The compiler for your views.
        # extension: 'jade'        # extension of your server views
        # path: 'views'            # This is the path to project views, it can be absolute or
                                   # relative. If defaultServer.enabled is true, it is relative to the
                                   # root of the project. If defaultServer.enabled is false it is
                                   # relative to the server.path setting above.
  """

exports.validate = (config, validators) ->
  errors = []

  if validators.ifExistsIsObject(errors, "server config", config.server)
    validators.ifExistsIsBoolean(errors, "server.defaultServer.enabled", config.server.defaultServer.enabled)
    validators.ifExistsIsBoolean(errors, "server.defaultServer.onePager", config.server.defaultServer.onePager)
    validators.ifExistsIsString(errors, "server.path", config.server.path)
    validators.ifExistsIsString(errors, "server.packageJSONDir", config.server.packageJSONDir)
    validators.ifExistsIsNumber(errors, "server.port", config.server.port)
    validators.ifExistsIsString(errors, "server.base", config.server.base)

    if validators.ifExistsIsObject(errors, "server.views", config.server.views)
      if validators.ifExistsIsString(errors, "server.views.compileWith", config.server.views.compileWith)
        unless ["jade", "hogan", "html", "ejs", "handlebars", "dust"].indexOf(config.server.views.compileWith) > -1
          errors.push "server.views.compileWith must be one of the following: jade, hogan, html, ejs, handlebars, dust."
      validators.ifExistsIsString(errors, "server.views.extension", config.server.views.extension)
      validators.ifExistsIsString(errors, "server.views.path", config.server.views.path)

  if errors.length is 0
    if config.server.views.compileWith is "html"
      config.server.views.compileWith = "ejs"
      config.server.views.html = true

    config.server.path = validators.determinePath config.server.path, config.root

    viewsRelativeTo = if config.server.defaultServer.enabled
      config.root
    else
      path.dirname(config.server.path)

    config.server.views.path = validators.determinePath config.server.views.path, viewsRelativeTo

    if config.isServer

      if not fs.existsSync(config.server.views.path)
        errors.push "server.views.path [[ #{config.server.views.path}) ]] cannot be found"
      else if fs.statSync(config.server.views.path).isFile()
        errors.push "server.views.path [[ #{config.server.views.path} ]] cannot be found, expecting a directory and is a file"

      unless config.server.defaultServer.enabled
        if not fs.existsSync(config.server.path)
          errors.push "server.path [[ #{config.server.path}) ]] cannot be found"
        else if fs.statSync(config.server.path).isDirectory()
          errors.push "server.path [[ #{config.server.path} ]] cannot be found, expecting a file and is a directory"

        config.server.packageJSONDir = validators.determinePath config.server.packageJSONDir ? config.root, config.root
        config.server.packageJSONDir = path.join(config.server.packageJSONDir, "package.json")
        if fs.existsSync(config.server.packageJSONDir)
          config.server.packageJSON = require config.server.packageJSONDir
        else
          errors.push "server.packageJSONDir [[ #{config.server.packageJSONDir}) ]] cannot be found"

  errors
