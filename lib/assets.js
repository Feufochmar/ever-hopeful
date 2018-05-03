var Promiserr = require('bluebird')
var path = require('path')
var namer = require('./namer')
var fs = require('fs')
var mkdirp = require('mkdirp')
var Configurable = require('./configurable')

var gitmech

function Asset (name, revision) {
  Configurable.call(this)
  name = name || ''
  this.setNames(name)
  this.revision = revision || 'HEAD'
  this.metadata = {}
  this.error = ''
  this.author = ''
  this.hashes = []
  this.lastCommitMessage = ''
}

Asset.prototype = Object.create(Configurable.prototype)

Asset.prototype.setNames = function (name) {
  this.name = name
  this.wikiname = namer.wikify(this.name)
  this.filename = this.wikiname
  this.relativePathName = this.getConfig().application.uploadSubdir + '/' + this.filename
  this.pathname = gitmech.absPath(this.relativePathName)
}

Asset.prototype.remove = function () {
  return new Promiserr(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }
    gitmech.rm(this.relativePathName, 'Asset removed (' + this.wikiname + ')', this.author, function (err) {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  }.bind(this))
}

Asset.prototype.renameTo = function (newName) {
  var newFilename = newName
  var pathNewFilename = this.getConfig().application.uploadSubdir + '/' + newFilename

  return new Promiserr(function (resolve, reject) {
    var newFile = gitmech.absPath(pathNewFilename)
    // Cannot rename if the file already exists
    if (fs.existsSync(newFile)) {
      reject()
      return
    }
    // Create the directory if it does not exist
    mkdirp(path.dirname(newFile), function (err) {
      if (err) {
        reject(err)
        return
      }
      // Move the file
      gitmech.mv(
        this.relativePathName,
        pathNewFilename,
        'Asset renamed (' + this.filename + ' => ' + newFilename + ')',
        this.author,
        function (err) {
          if (err) {
            reject(err)
          } else {
            this.setNames(newName)
            resolve()
          }
        }.bind(this))
    }.bind(this))
  }.bind(this))
}

Asset.prototype.exists = function () {
  return fs.existsSync(this.pathname)
}

// Save the asset by copying its content from tempFile
Asset.prototype.save = function (tempFile, message) {
  message = message || ''

  return new Promiserr(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    var defMessage = (this.exists() ? 'Asset updated' : 'Asset added') + ' (' + this.wikiname + ')'

    message = (message.trim() === '') ? defMessage : message.trim()

    // Make the directory, if it does not exists
    mkdirp(path.dirname(this.pathname), function (err) {
      if (err) {
        reject(err)
        return
      }
      // Move the file to its location
      fs.readFile(tempFile, function (err, data) {
        if (err) {
          reject(err)
          return
        }
        // Write the file
        fs.writeFile(this.pathname, data, function (err) {
          if (err) {
            reject(err)
            return
          }
          // Commit the file
          gitmech.add(this.relativePathName, message, this.author, function (err) {
            if (err) {
              reject(err)
              return
            }
            // Remove the temporary file
            fs.unlink(tempFile, function (err) {
              // ignore error, trace it only
              if (err) {
                console.log(err)
              }
              resolve()
            })
          })
        }.bind(this))
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

// '%2F' should be rendered as '/' in links, url, etc.
Asset.prototype.urlName = function () {
  var wname = encodeURIComponent(this.wikiname)
  return wname.replace(/%2F/g, '/')
}

Asset.prototype.urlForDisplay = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/uploads/' + wname
}

Asset.prototype.urlForShow = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/assets/show/' + wname
}

Asset.prototype.urlForMove = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/assets/' + wname
}

Asset.prototype.urlForDelete = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/assets/' + wname
}

Asset.prototype.fetch = function (extended) {
  if (!extended) {
    return Promiserr.all([this.fetchMetadata(),
                         this.fetchHashes(1)
    ])
  } else {
    return Promiserr.all([this.fetchMetadata(),
                         this.fetchHashes(),
                         this.fetchLastCommitMessage()])
  }
}

Asset.prototype.fetchMetadata = function () {
  return new Promiserr(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.log(this.relativePathName, this.revision, function (err, metadata) {
      if (err) {
        this.error = err
      } else {
        if (typeof metadata !== 'undefined') {
          this.metadata = metadata
        }
      }
      resolve()
    }.bind(this))
  }.bind(this))
}

Asset.prototype.fetchHashes = function (howmany) {
  howmany = howmany || 2

  return new Promiserr(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.hashes(this.relativePathName, howmany, function (err, hashes) {
      if (err) {
        this.error = err
      } else {
        this.hashes = hashes
      }

      resolve()
    }.bind(this))
  }.bind(this))
}

Asset.prototype.fetchLastCommitMessage = function () {
  return new Promiserr(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.lastMessage(this.relativePathName, 'HEAD', function (err, message) {
      if (err) {
        this.error = err
      } else {
        this.lastCommitMessage = message
      }

      resolve()
    }.bind(this))
  }.bind(this))
}

Asset.prototype.fetchHistory = function () {
  return new Promiserr(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.log(this.relativePathName, 'HEAD', 30, function (err, history) {
      if (err) {
        this.error = err
      }

      resolve(history)
    }.bind(this))
  }.bind(this))
}

Asset.prototype.fetchRevisionsDiff = function (revisions) {
  return new Promiserr(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.diff(this.relativePathName, revisions, function (err, diff) {
      if (err) {
        this.error = err
      }

      resolve(diff)
    }.bind(this))
  }.bind(this))
}

Asset.prototype.revert = function () {
  return new Promiserr(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    if (this.revision === 'HEAD') {
      reject()
      return
    }

    gitmech.revert(this.relativePathName, this.revision, this.author, function (err, data) {
      if (err) {
        this.error = err
        reject(err)
        return
      }
      resolve(data)
    }.bind(this))
  }.bind(this))
}

function Assets () {
  this.models = []
  this.total = 0
  Configurable.call(this)
}

Assets.prototype = Object.create(Configurable.prototype)

Assets.prototype.fetch = function (pagen) {
  return new Promiserr(function (resolve, reject) {
    gitmech.ls(this.getConfig().application.uploadSubdir, /.*/, function (err, list) {
      var model
      var Promisers = []

      if (err) {
        reject(err)
        return
      }

      var itemsPerPage = this.getConfig().pages.itemsPerPage

      this.total = list.length
      this.totalPages = Math.ceil(this.total / itemsPerPage)

      if (pagen <= 0) {
        pagen = 1
      }
      if (pagen > this.totalPages) {
        pagen = this.totalPages
      }

      this.currentPage = pagen

      // Read the stats from the fs to be able to sort the whole
      // list before slicing the asset out
      var listWithData = list.map(function (asset) {
        var stats

        try {
          stats = fs.statSync(gitmech.absPath(asset))
        } catch (e) {
          stats = null
        }
        return {
          name: asset,
          stats: stats
        }
      })

      listWithData.sort(function (a, b) {
        return (a.stats !== null && b.stats !== null) ? b.stats.mtime.getTime() - a.stats.mtime.getTime() : 0
      })

      var offset = (pagen - 1) * itemsPerPage
      var slice = listWithData.slice(offset, offset + itemsPerPage)

      slice.forEach(function (data) {
        var asset = data.name.replace(new RegExp('^' + this.getConfig().application.uploadSubdir + '/'), '')
        model = new Asset(asset)
        this.models.push(model)
        Promisers.push(model.fetch(true))
      }.bind(this))

      Promiserr.all(Promisers).then(resolve)
    }.bind(this))
  }.bind(this))
}

var assets = {
  Asset: Asset,
  Assets: Assets,
  use: function (git) {
    gitmech = git
  }
}

module.exports = assets
