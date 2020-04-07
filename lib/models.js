const path = require('path')
const namer = require('./namer')
const fs = require('fs')
const util = require('util')
const Configurable = require('./configurable')
const locker = require('./locker')

var gitmech

function Page (name, revision) {
  Configurable.call(this)
  name = name || ''
  this.setNames(name)
  this.revision = revision || 'HEAD'
  this.content = ''
  this.title = ''
  this.shortTitle = ''
  this.metadata = {}
  this.error = ''
  this.author = ''
  this.lockedBy = null
  this.hashes = []
  this.lastCommand = ''
  this.lastCommitMessage = ''
}

Page.prototype = Object.create(Configurable.prototype)

Page.prototype.setNames = function (name) {
  this.name = namer.unwikify(name.replace(/\.md$/, ''))
  this.wikiname = namer.wikify(this.name)
  this.filename = this.wikiname + '.md'
  this.relativePathName = this.getConfig().application.docSubdir + '/' + this.filename
  this.pathname = gitmech.absPath(this.relativePathName)
}

Page.prototype.remove = function () {
  return new Promise(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }
    gitmech.rm(this.relativePathName, 'Page removed (' + this.wikiname + ')', this.author, function (err) {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  }.bind(this))
}

Page.prototype.renameTo = function (newName) {
  var newFilename = newName + '.md'
  var pathNewFilename = this.getConfig().application.docSubdir + '/' + newFilename

  return new Promise(function (resolve, reject) {
    var newFile = gitmech.absPath(pathNewFilename)
    // Cannot rename if the file already exists
    if (fs.existsSync(newFile)) {
      reject()
      return
    }
    // Create the directory if it does not exist
    fs.mkdir(path.dirname(newFile), {recursive: true}, function (err) {
      if (err) {
        reject(err)
        return
      }
      // Move the file
      gitmech.mv(
        this.relativePathName,
        pathNewFilename,
        'Page renamed (' + this.filename + ' => ' + newFilename + ')',
        this.author,
        function (err) {
          if (err) {
            reject()
          } else {
            this.setNames(newName)
            resolve()
          }
        }.bind(this))
    }.bind(this))
  }.bind(this))
}

Page.prototype.exists = function () {
  return fs.existsSync(this.pathname)
}

Page.prototype.save = function (message) {
  message = message || ''

  return new Promise(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    var defMessage = (this.exists() ? 'Content updated' : 'Page created') + ' (' + this.wikiname + ')'

    message = (message.trim() === '') ? defMessage : message.trim()

    var content = this.content

    if (this.getConfig().pages.title.fromContent) {
      content = '# ' + this.title + '\n' + content
    }

    content = content.replace(/\r\n/gm, '\n')

    // Make the directory, if it does not exists
    fs.mkdir(path.dirname(this.pathname), {recursive: true}, function (err) {
      if (err) {
        reject(err)
        return
      }
      // Write the file
      fs.writeFile(this.pathname, content, function (err) {
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
          //
          resolve(content)
        })
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

// '%2F' should be rendered as '/' in links, url, etc.
Page.prototype.urlName = function () {
  var wname = encodeURIComponent(this.wikiname)
  return wname.replace(/%2F/g, '/')
}

Page.prototype.urlForShow = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/wiki/' + wname
}

Page.prototype.urlForEdit = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/pages/edit/' + wname
}

Page.prototype.urlForEditWithError = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/pages/edit/' + wname + '?e=1'
}

Page.prototype.urlForEditPut = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/pages/' + wname
}

Page.prototype.urlForDelete = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/pages/' + wname
}

Page.prototype.urlForNew = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/pages/new/' + wname
}

Page.prototype.urlForNewWithError = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/pages/new/' + wname + '?e=1'
}

Page.prototype.urlForRevert = function (version) {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/pages/revert/' + version + '/' + wname
}

Page.prototype.urlForHistory = function () {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/history/' + wname
}

Page.prototype.urlForCompare = function (revisions) {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/compare/' + revisions + '/' + wname
}

Page.prototype.urlForVersion = function (version) {
  var wname = this.urlName()
  var proxy = this.getProxyPath() || ''
  return proxy + '/version/' + version + '/' + wname
}

// If the page contains '/' in its name, split the name to make it appear as 'subpages'
Page.prototype.getPaths = function () {
  var pathElements = this.name.split('/')
  var ret = ''
  var path = ''
  this.name.split('/').forEach(function (val) {
    if (path !== '') {
      ret = ret + '> '
      path = path + '/'
    }
    path = path + val
    ret = ret + '[[' + val + '|' + path + ']] '
  })
  return ret
}

Page.prototype.isIndex = function () {
  return this.getConfig().pages.index === this.name
}

Page.prototype.isFooter = function () {
  return this.name === '_footer'
}

Page.prototype.isSidebar = function () {
  return this.name === '_sidebar'
}

Page.prototype.lock = function (user) {
  var lock = locker.getLock(this.name)

  if (lock && lock.user.asGitAuthor !== user.asGitAuthor) {
    this.lockedBy = lock.user
    return false
  }

  locker.lock(this.name, user)
  this.lockedBy = user
  return true
}

Page.prototype.unlock = function (user) {
  this.lockedBy = null
  locker.unlock(this.name)
}

Page.prototype.fetch = function (extended) {
  if (!extended) {
    return Promise.all([this.fetchContent(),
                        this.fetchMetadata(),
                        this.fetchHashes(1)
                        ])
  } else {
    return Promise.all([this.fetchContent(),
                        this.fetchMetadata(),
                        this.fetchHashes(),
                        this.fetchLastCommitMessage()])
  }
}

Page.prototype.fetchContent = function () {
  return new Promise(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.show(this.relativePathName, this.revision, function (err, content) {
      this.lastCommand = 'show'

      content = content || ''

      if (err) {
        this.error = err
      } else {
        this.rawContent = content

        if (content.length === 0 || this.getConfig().pages.title.fromFilename) {
          this.title = this.name
          this.shortTitle = this.title.split('/').reverse()[0]
          this.content = content
        } else {
          // Retrieves the title from the first line of the content (and removes it from the actual content)
          // The title is stored as the first line of the document, prefixed by a '#'
          var lines = content.split('\n')
          this.title = lines[0].trim()

          if (this.title.charAt(0) === '#') {
            this.title = this.title.substr(1).trim()
            this.shortTitle = this.title
            this.content = lines.slice(1).join('\n')
          } else {
            // Mmmmh... this file doesn't seem to follow the convention...
            this.title = this.name
            this.shortTitle = this.title.split('/').reverse()[0]
            this.content = content
          }
        }
      }

      resolve()
    }.bind(this))
  }.bind(this))
}

Page.prototype.fetchMetadata = function () {
  return new Promise(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.log(this.relativePathName, this.revision, function (err, metadata) {
      this.lastCommand = 'log'

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

Page.prototype.fetchHashes = function (howmany) {
  howmany = howmany || 2

  return new Promise(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.hashes(this.relativePathName, howmany, function (err, hashes) {
      this.lastCommand = 'hashes'

      if (err) {
        this.error = err
      } else {
        this.hashes = hashes
      }

      resolve()
    }.bind(this))
  }.bind(this))
}

Page.prototype.fetchLastCommitMessage = function () {
  return new Promise(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.lastMessage(this.relativePathName, 'HEAD', function (err, message) {
      this.lastCommand = 'lastMessage'

      if (err) {
        this.error = err
      } else {
        this.lastCommitMessage = message
      }

      resolve()
    }.bind(this))
  }.bind(this))
}

Page.prototype.fetchHistory = function () {
  return new Promise(function (resolve, reject) {
    if (this.error) {
      resolve()
      return
    }

    gitmech.log(this.relativePathName, 'HEAD', 30, function (err, history) {
      this.lastCommand = 'log'

      if (err) {
        this.error = err
      }

      resolve(history)
    }.bind(this))
  }.bind(this))
}

Page.prototype.fetchRevisionsDiff = function (revisions) {
  return new Promise(function (resolve, reject) {
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

Page.prototype.revert = function () {
  return new Promise(function (resolve, reject) {
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

function Pages () {
  this.models = []
  this.total = 0
  Configurable.call(this)
}

Pages.prototype = Object.create(Configurable.prototype)

Pages.prototype.fetch = function (pagen) {
  return new Promise(function (resolve, reject) {
    gitmech.ls(this.getConfig().application.docSubdir, /\.md$/, function (err, list) {
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
      // list before slicing the page out
      var listWithData = list.map(function (page) {
        var stats

        try {
          stats = fs.statSync(gitmech.absPath(page))
        } catch (e) {
          stats = null
        }
        return {
          name: page,
          stats: stats
        }
      })

      listWithData.sort(function (a, b) {
        return (a.stats !== null && b.stats !== null) ? b.stats.mtime.getTime() - a.stats.mtime.getTime() : 0
      })

      var offset = (pagen - 1) * itemsPerPage
      var slice = listWithData.slice(offset, offset + itemsPerPage)

      slice.forEach(function (data) {
        var page = data.name.replace(/\.md$/, '').replace(new RegExp('^' + this.getConfig().application.docSubdir + '/'), '')
        model = new Page(page)
        this.models.push(model)
        Promisers.push(model.fetch(true))
      }.bind(this))

      Promise.all(Promisers).then(resolve)
    }.bind(this))
  }.bind(this))
}

Pages.prototype.findString = function (string, callback) {
  gitmech.grep(string, function (err, items) {
    var parsedItems = items.map(function (item) {
      var record = item.split(':')
      return {
        pageName: record[0].replace(/\.md$/, '').replace(new RegExp('^' + this.getConfig().application.docSubdir + '/'), ''),
        line: record[1] ? ', L' + record[1] : '',
        text: record.slice(2).join('')
      }
    }.bind(this))
    callback(err, parsedItems)
  }.bind(this))
}

const models = {

  Page: Page,

  Pages: Pages,

  use: function (git) {
    gitmech = git
  },

  repositories: {
    refresh: function (callback) {
      gitmech.pull(function (err) {
        callback(err)
      })
    },
  }
}

models.repositories.refreshAsync = util.promisify(models.repositories.refresh)

module.exports = models
