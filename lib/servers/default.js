var connections, currentServer, engines, express, _, _removeFromConnections;

express = require('express');

engines = require('consolidate');

_ = require('lodash');

connections = [];

currentServer = null;

_removeFromConnections = function(id) {
  return connections = connections.filter(function(conn) {
    return conn._id !== id;
  });
};

exports.start = function(config, options, done) {
  var app, indexName, useReload, _ref, _ref1;
  config.log.debug("Setting up default express server");
  app = express();
  options.userServer = currentServer = app.listen(config.server.port, (function(_this) {
    return function() {
      config.log.success("Mimosa's bundled Express started at [[ http://localhost:" + config.server.port + config.server.base + " ]]");
      return done();
    };
  })(this));
  currentServer.on('connection', function(conn) {
    conn._id = new Date().getTime();
    conn.on('close', function() {
      return _removeFromConnections(conn._id);
    });
    return connections.push(conn);
  });
  app.configure((function(_this) {
    return function() {
      app.set('port', config.server.port);
      app.set('views', config.server.views.path);
      app.engine(config.server.views.extension, engines[config.server.views.compileWith]);
      app.set('view engine', config.server.views.extension);
      app.use(express.favicon());
      app.use(express.urlencoded());
      app.use(express.json());
      app.use(express.methodOverride());
      app.use(function(req, res, next) {
        res.header('Cache-Control', 'no-cache');
        return next();
      });
      app.use(express.compress());
      app.use(express["static"](config.watch.compiledDir));
      return app.use(config.server.base, app.router);
    };
  })(this));
  if (config.server.views.html) {
    indexName = config.isOptimize ? 'index-optimize' : 'index';
    if (config.server.defaultServer.onePager) {
      return app.get('*/?', function(req, res) {
        return res.render(indexName);
      });
    } else {
      app.get('/', function(req, res) {
        return res.render(indexName);
      });
      return app.get('/:viewname*/?', function(req, res) {
        var viewName;
        viewName = req.params.viewname;
        if (config.isOptimize) {
          viewName += "-optimize";
        }
        return res.render(viewName);
      });
    }
  } else {
    useReload = ((_ref = config.liveReload) != null ? _ref.enabled : void 0) != null ? config.liveReload.enabled : void 0;
    options = {
      reload: useReload,
      optimize: (_ref1 = config.isOptimize) != null ? _ref1 : false,
      cachebust: process.env.NODE_ENV !== "production" ? "?b=" + ((new Date()).getTime()) : '',
      pretty: true
    };
    _.extend(options, config.server.views.options);
    if (config.server.defaultServer.onePager) {
      return app.get('*/?', function(req, res) {
        return res.render('index', options);
      });
    } else {
      app.get('/', function(req, res) {
        return res.render('index', options);
      });
      return app.get('/:viewname*/?', function(req, res) {
        var err;
        try {
          return res.render(req.params.viewname, options, function(err, html) {
            if (err) {
              config.log.warn("Sending 404 for URL [[ " + req.url + " ]], ", err);
              return res.send(404, "Could not find " + req.params.viewname);
            } else {
              return res.send(html);
            }
          });
        } catch (_error) {
          err = _error;
          return res.send(404, "Could not find " + req.params.viewname);
        }
      });
    }
  }
};
