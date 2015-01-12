mimosa-server
===========

This is Mimosa's server module.  It contains both a hosted-server as well as the ability to invoke existing node servers.

* For more information regarding Mimosa, see http://mimosa.io

# Usage

Add `'server'` to your list of modules.  That's all!  Mimosa will install the module for you when you start `mimosa watch` or `mimosa build`.

# Functionality

### Topic

#### SubTopic

# Default Config

```javascript
server: {
  defaultServer: {
    enabled: false,
    onePager: false
  },
  path: 'server.js',
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