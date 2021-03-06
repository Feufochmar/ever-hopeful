// Common functions for routing

var common = {
  // Remove trailing '/' when searching pages
  getPageName: function (req) {
    var name = req.params[0] || ''
    return name.replace(/\/+$/, '')
  },
  // Asset name
  getAssetName: function(req) {
    return req.params[0]
  },
  // Render the 404 page
  render404: function (res) {
    res.locals.title = '404 – Not found'
    res.statusCode = 404
    res.render('404')
  },
  // Render error 500 page
  render500: function (res, err) {
    res.locals.title = '500 - Internal server error'
    res.statusCode = 500
    console.log(err)
    res.render('500', {
      message: 'Sorry, something went wrong and I cannot recover. If you think this might be a bug in Ever-Hopeful, please file a detailed report about what you were doing here: https://github.com/Feufochmar/ever-hopeful/issues . Thank you!',
      error: err
    })
  },
  // Update the notice/warning/error
  showNotices: function (req, res) {
    res.locals.errors = req.session.errors
    res.locals.warning = req.session.warning
    res.locals.notice = req.session.notice
    delete req.session.errors
    delete req.session.warning
    delete req.session.notice
  }
}

module.exports = common
