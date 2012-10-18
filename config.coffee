exports.defaults = ->
  server:
    useDefaultServer: false
    useReload: true
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
      # useReload: true                     # when true, browser will be reloaded when asset is compiled.
      # path: 'server.coffee'               # valid when useDefaultServer: false, path to file for provided server which must contain
                                            # export startServer method that takes an enriched mimosa-config object
      # port: 3000                          # port to start server on
      # base: ''                            # base of url for the app, if altered should start with a slash
      # views:                              # configuration for the view layer of your application
        # compileWith: 'jade'               # Other valid options: "hogan", "html", "ejs". The compiler for your views.
        # extension: 'jade'                 # extension of your server views
        # path: 'views'                     # path from the root of your project to your views
  """

exports.validate = ->

