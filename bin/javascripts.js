var babel = require('babel');
var browserify = require('browserify');
var colors = require('colors');
var fse = require('fs-extra');
var path = require('path');
var watchify = require('watchify');

/**
 * Create a transpiler object binded to a `srcDirectory` and a `distDirectory`
 */
function getTranspiler(srcDirectory, distDirectory, isAllowed, babelOptions, browserifyOptions) {

  /**
   * Add watchify to the browserify options. client only.
   */
  if (browserifyOptions !== undefined) {
    Object.assign(browserifyOptions, {
      cache: {}, // required for watchify
      packageCache: {}, // required for watchify
    });

    if (browserifyOptions.plugin)
      browserifyOptions.plugin.push(watchify);
    else
      browserifyOptions.plugin = [watchify];
  }

  /**
   * Returns the name of the target transpiled file
   */
  function getTarget(filename) {
    return filename.replace(new RegExp('^' + srcDirectory), distDirectory);
  }

  /**
   * Returns the path transpiled `index.js` file the client folder in which resides
   * the given `filename`
   */
  function getClientEntryPoint(filename) {
    const folderName = getClientFolderName(filename);
    const entryPoint = path.join(distDirectory, folderName, 'index.js');
    return entryPoint;
  }

  /**
   * Returns the name of the 1rst level folder inside `srcDirectory` in which the
   * client side javascript file resides.
   */
  function getClientFolderName(filename) {
    const relFilename = filename.replace(new RegExp('^' + srcDirectory), '');
    const folderName = relFilename.split(path.sep)[1];
    return folderName;
  }

  /**
   * returns the transpiler to be consumed.
   */
  return {
    /**
     * Transpile the given file from es6 to es5. If the given stack is not empty
     * call the method recursively till its empty. When the stack is empty,
     * execute the callback.
     */
    transpile: function(filename, stack, callback) {
      /**
       * If stack is not empty transpile the next entry, else execute the
       * callback if any.
       */
      function next() {
        if (stack && stack.length > 0)
          transpile(stack.shift(), stack, callback);
        else if (stack.length === 0 && callback)
          callback();
      }

      if (filename === undefined || !isAllowed(filename))
        return next();

      var outFilename = getTarget(filename);

      babel.transformFile(filename, babelOptions, function(err, result) {
        if (err) {
          console.log(('=> %s').red, err.message);
          console.log(err.codeFrame);
          return;
        }

        fse.outputFile(outFilename, result.code, function(err) {
          if (err)
            return console.error(err.message);

          console.log('=> "%s" successfully transpiled to "%s"'.green, filename, outFilename);
          next();
        });
      });
    },

    /** @private */
    _bundlers: [],

    /**
     * Transform a given file to it's browserified version, client only.
     * Only clients have their browserified counterparts, each folder in `src/client`
     * is considered has a separate browserified client file. The `index.js` in each
     * folder defines the entry point of the particular client. The browserified
     * file is name after the name of the folder.
     */
    bundle: function(filename, bundleDistDirectory, ensureFile) {
      if (filename === undefined || !isAllowed(filename, ensureFile))
        return;

      // get the entry point of the client (`index.js`)
      const entryPoint = getClientEntryPoint(filename);
      const outBasename = getClientFolderName(filename) + '.js';
      const outFilename = path.join(bundleDistDirectory, outBasename);

      if (!this._bundlers[entryPoint]) {
        var bundler = browserify(entryPoint, browserifyOptions);

        function rebundle() {
          console.log('=> Start bundling "%s"'.yellow, outFilename);
          var start = new Date().getTime();

          bundler
            .bundle()
            .on('error', function(err) {
              console.error(('=> ' + err.message).red);
            })
            .on('end', function() {
              var dt = (new Date().getTime() - start);
              console.log('=> "%s" successfully created (compiled in: %sms)'.green, outFilename, dt);
            })
            .pipe(fse.createWriteStream(outFilename));
        }

        bundler.on('update', rebundle);
        rebundle();

        this._bundlers[entryPoint] = bundler;
      }
    },

    /**
     * Delete the transpiled file.
     */
    delete: function(filename, callback) {
      var outFilename = getTarget(filename);

      if (fse.statSync(outFilename).isFile()) {
        fse.remove(outFilename, function(err) {
          if (err)
            return console.log(err.message);

          console.log('=> "%s" successfully removed'.yellow, outFilename);

          if (callback)
            callback();
        });
      } else {
        callback();
      }
    },
  };
}

module.exports = {
  getTranspiler: getTranspiler
};