"use strict"

path = require 'path'
fs   = require 'fs'

exports.defaults = ->
  server:
    useDefaultServer: false
    path: 'server.coffee'
    port: 3000
    base: ''
    views:
      compileWith: 'jade'
      extension: 'jade'
      path: 'views'

exports.placeholder = ->
  """
  \t

    # server:                               # configuration for server when server option is enabled via CLI
      # useDefaultServer: false             # whether or not mimosa starts a default server for you, when true, mimosa starts its
                                            # own on the port below, when false, mimosa will use server provided by path below
      # path: 'server.coffee'               # valid when useDefaultServer: false, path to file for provided server which must contain
                                            # export startServer method that takes an enriched mimosa-config object
      # port: 3000                          # port to start server on
      # base: ''                            # base of url for the app, if altered should start with a slash
      # views:                              # configuration for the view layer of your application
        # compileWith: 'jade'               # Other valid options: "hogan", "html", "ejs". The compiler for your views.
        # extension: 'jade'                 # extension of your server views
        # path: 'views'                     # path from the root of your project to your views
  """

exports.validate = (config) ->
  errors = []
  if config.server?
    if typeof config.server is "object" and not Array.isArray(config.server)
      if config.server.useDefaultServer?
        unless typeof config.server.useDefaultServer is "boolean"
          errors.push "server.useDefaultServer must be a boolean."
      if config.server.path?
        unless typeof config.server.path is "string"
          errors.push "server.path must be a string."
      if config.server.port?
        unless typeof config.server.port is "number"
          errors.push "server.port must be a number."
      if config.server.base?
        unless typeof config.server.base is "string"
          errors.push "server.base must be a string."

      if config.server.views?
        if typeof config.server.views is "object" and not Array.isArray(config.server.views)
          if config.server.views.compileWith?
            unless typeof config.server.views.compileWith is "string"
              errors.push "server.views.compileWith must be a string."
          if config.server.views.extension?
            unless typeof config.server.views.extension is "string"
              errors.push "server.views.extension must be a string."
          if config.server.views.path?
            unless typeof config.server.views.path is "string"
              errors.push "server.views.path must be a string."
        else
          errors.push "server.views must be an object."
    else
      errors.push "server configuration must be an object."

  if errors.length is 0
    config.server.path =       path.join config.root, config.server.path
    config.server.views.path = path.join config.root, config.server.views.path
    if config.server.views.compileWith is "html"
      config.server.views.compileWith = "ejs"
      config.server.views.html = true

    if config.isServer and not config.server.useDefaultServer
      if not fs.existsSync(config.server.path)
        errors.push "server.path [[ #{config.server.path}) ]] cannot be found"
      else if fs.statSync(config.server.path).isDirectory()
        errors.push "server.path [[ #{config.server.path} ]] cannot be found, expecting a file and is a directory"

  errors

