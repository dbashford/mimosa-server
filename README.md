mimosa-server
===========

This is Mimosa's server module.  It contains both a hosted-server as well as the ability to invoke existing node servers.

* For more information regarding Mimosa, see http://mimosa.io

# Usage

Add `'server'` to your list of modules.  That's all!  Mimosa will install the module for you when you start `mimosa watch` or `mimosa build`.

## `--server` flag

mimosa-server will only execute when the `--server` flag is used with `mimosa watch`.  The `--server` flag is an indication to this module that a server needs to be started once Mimosa has processed all of the project's assets.

# Functionality

mimosa-server's job is to start a server during `mimosa watch`.  What server it starts is determined by how this module is configured.  mimosa-server is capable of starting either a server (Express) embedded within this module, and it is capable of starting your node.js based server.

### Embedded Server

mimosa-server comes bundled with its own Express server. If `server.defaultServer.enabled` is set to `true` in the mimosa-config, then when `mimosa watch` is run with the `--server` flag, mimosa-server will run its embedded server. When running mimosa-server's Express, all of the settings in the server portion of the mimosa-config become very important. See the [module configuration](#default-config) to learn more.

mimosa-server Express will do a few things in addition to serving up an application. If you are using the [mimosa-live-reload module](https://github.com/dbashford/mimosa-live-reload), and  assuming `liveReload.enabled` is set to `true` (default), mimosa-live reload will be engaged.

mimosa-server will also serve static assets gzipped.

#### View Routing

How mimosa-server routes a project's paths depends on the setting for `server.defaultServer.onePager`.

When `onePager` is set to `true` the embedded Express server is configured to automatically route every request to the application's index view that doesn't result in an asset being returned. For instance given a URL of `/account/1/item/2/comment/4` mimosa-server's embedded server will route the request to the index view and leave the handling of the complex URL to the client code.

When `onePager` is set to false, Mimosa will assume simple routes for the application. `url:3000/` will still route to the index view. But `url:3000/foo/` will route to the foo view as will `url:3000/foo/bar/baz`.

### Hooking Into Your node.js Server

Mimosa can start a node.js based server. If `server.defaultServer.enabled` is set to `false`, Mimosa will look for a piece of node.js code located at `server.path` and execute the `startServer` function of that code (so that function must be `export`ed). That function will be passed the entire resolved and enriched mimosa-config.

The `startServer` function is also passed a callback that must be executed for Mimosa to continue through its workflows. If using [mimosa-live-reload](https://github.com/dbashford/mimosa-live-reload), the callback should be provided node's http server object as a first parameter. That happens to be the object returned by, for instance, Express's `app.listen()` function or Hapi's `server.listener` property. If socket.io and live-reload are being used, then the callback should be provided the socket.io object as a second parameter.

### Server Views

`server.views.compileWith` can be configured to use one of the following available templating libraries, and each library has a default extension. The `server.views.compileWith` values are listed below next to the name of each technology. The default extensions are listed as well.

* Jade `.jade`
* EJS `.ejs`
* Hogan `.hjs`
* Handlebars `.hbs`
* Dust `.dust`
* HTML `.html`

# Default Config

```javascript
server: {
  defaultServer: {
    enabled: false,
    onePager: false
  },
  path: 'server.js',
  transpiler: null,  
  port: 3000,
  base: '',
  views: {
    compileWith: 'jade',
    extension: 'jade',
    path: 'views',
    options: {}
  }
}
```

#### `server.defaultServer.enabled` boolean
Determines whether Mimosa will start a default server or attempt to use a server in the project. When set to `true`, mimosa-server will run an embedded Express.

#### `server.defaultServer.onePager` boolean
Whether a project is a one or multi page application. This effects how mimosa-server's embedded server handles routing. See above for more details on the embedded server and routing.

#### `server.path` string
When `defaultServer.enabled` is set to `false`, `server.path` is the path to the project's server code. The path can be relative to the root of the application or absolute. The server code at `server.path` must export a `startServer` function. Mimosa will pass that method a copy of the mimosa-config. `startServer` will also be passed a callback that it must execute when complete. Both 'server.coffee' and 'server.js' are valid defaults.

#### `server.transpiler` transpiler library
If your application is written in a language that needs transpiling, `require('')` the transpiler here. For instance, `require('coffee-script')`.

#### `server.port` number
The port on which mimosa-server starts the server.

#### `server.base` string
The base path of the application. By default this is set to blank, so the application is served up at http://localhost:3000, but set base to `app` and the application would be served at http://localhost:3000/app.

#### `server.views.compileWith` string
The language/library of the server views. Valid values: `jade`, `hogan`, `ejs`, `dust` and `handlebars`.

#### `server.views.extension` string
Extension of server views.

#### `server.views.path` string
The path to server views. The path can be either absolute or relative. If `server.defaultServer.enabled` is set to `true`, `server.views.path` is relative to the root of the project. If `server.defaultServer.enabled` is set to `false`, `server.views.path` is relative to `server.path`.

#### `server.views.options` object
Options to pass to any views being served by Mimosa's default server.