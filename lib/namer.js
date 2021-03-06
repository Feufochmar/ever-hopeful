var tr = require('transliteration').transliterate
var Configurable = require('./configurable')

var Namer = function () {
  Configurable.call(this)
}

Namer.prototype = Object.create(Configurable.prototype)

Namer.prototype.wikify = function (str) {
  var ret = str

  if (typeof ret !== 'string' || ret.trim() === '') {
    return ''
  }

  var pc = this.getConfig().pages

  if (pc.title.asciiOnly) {
    ret = tr(ret).replace(/[^a-zA-Z0-9\- _]/g, '')
  }

  ret = ret.trim()

  if (pc.title.lowercase) {
    ret = ret.toLowerCase()
  }

  return ret
}

// Not symmetric by any chance, but still better than nothing
Namer.prototype.unwikify = function (str) {
  var ret = str

  if (typeof ret !== 'string' || ret.trim() === '') {
    return ''
  }

  var pc = this.getConfig().pages

  if (pc.title.lowercase) {
    // "something really hot" => "Something Really Hot"
    ret = ret.split(/\b/).map(function (v) {
      return v.slice(0, 1).toUpperCase() + v.slice(1)
    }).join('')
  }

  return ret
}

module.exports = new Namer()
