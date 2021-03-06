"use strict"

config = require './config'
plugin = require './plugin'

module.exports =
  registration: plugin.registration
  defaults:     config.defaults
  placeholder:  config.placeholder
  validate:     config.validate
  startServer:  plugin.startServer