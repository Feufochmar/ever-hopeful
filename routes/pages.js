/* global Git */

var router = require('express').Router()
var namer = require('../lib/namer')
var app = require('../lib/app').getInstance()
var models = require('../lib/models')
var components = require('../lib/components')
var common = require('./common')
const {check, validationResult} = require('express-validator')

models.use(Git)

// Validation
const _pageCreateValidator = [
  check('pageTitle', 'The page title cannot be empty').exists().trim().isLength({min: 1}),
  check('content', 'The page content cannot be empty').exists().trim().isLength({min: 1}),
]
const _pageUpdateValidator = _pageCreateValidator.concat([
  check('message', 'Change message must be present.').exists().trim()
])
//
router.get('/pages/new', _getPagesNew)
router.get('/pages/new/*', _getPagesNew)
router.get('/pages/edit/*', _getPagesEdit)
router.post('/pages', _pageCreateValidator, _postPages)
router.put('/pages/*', _pageUpdateValidator, _putPages)
router.delete('/pages/*', _deletePages)
router.get('/pages/revert/:version/*', _getRevert)

var pagesConfig = app.locals.config.get('pages')
var proxyPath = app.locals.config.getProxyPath()

function _deletePages (req, res) {
  var page = new models.Page(common.getPageName(req))

  var redirectURL
  if (req.body && req.body.origin === 'list') {
    redirectURL = proxyPath + '/list'
  } else {
    redirectURL = proxyPath + '/'
  }

  if (page.isIndex() || !page.exists()) {
    req.session.notice = 'The page cannot be deleted.'
    res.redirect(redirectURL)
    return
  }

  page.author = req.user.asGitAuthor

  page.remove().then(function () {
    page.unlock()

    if (page.isFooter()) {
      app.locals._footer = null
    }

    if (page.isSidebar()) {
      app.locals._sidebar = null
    }

    req.session.notice = 'The page `' + page.wikiname + '` has been deleted.'
    res.redirect(redirectURL)
  })
}

function _getPagesNew (req, res) {
  var page
  var title = ''

  var pageName = common.getPageName(req)
  if (pageName !== '') {
    // This is not perfect, unfortunately
    title = namer.unwikify(pageName)
    page = new models.Page(title)
    if (page.exists()) {
      res.redirect(page.urlForShow())
      return
    }
  }

  common.showNotices(req, res)

  res.locals.formData = req.session.formData || {}
  delete req.session.formData

  res.render('create', {
    title: app.locals.config.get('application').title + ' – Create page ' + title,
    pageTitle: title,
    pageName: page ? page.wikiname : ''
  })
}

function _postPages (req, res) {
  // TODO: as pageTitle has not be validated yet, there may be problems in the redirect below
  var pageName
  if (pagesConfig.title.fromFilename) {
    // pageName (from url) is not considered
    pageName = req.body.pageTitle
  } else {
    // pageName (from url) is more important
    pageName = (namer.unwikify(req.body.pageName) || req.body.pageTitle)
  }
  var page = new models.Page(pageName)

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.session.errors = errors.array()
    // If the req.body is too big, the cookie session-store will crash,
    // logging out the user. For this reason we use the sessionStorage
    // on the client to save the body when submitting
    //    req.session.formData = req.body;
    req.session.formData = {
      pageTitle: req.body.pageTitle
    }
    res.redirect(page.urlForNewWithError())
    return
  }

  if (page.exists()) {
    req.session.errors = [{msg: 'A document with this title already exists'}]
    res.redirect(page.urlForNew())
    return
  }

  page.author = req.user.asGitAuthor
  page.title = req.body.pageTitle
  page.content = req.body.content

  page.save().then(function () {
    req.session.notice = 'The page has been created. <a href="' + page.urlForEdit() + '">Edit it again?</a>'
    res.redirect(page.urlForShow())
  }).catch(function (err) {
    common.render500(res, err)
  })
}

function _putPages (req, res) {
  const page = new models.Page(common.getPageName(req))

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fixErrors()
    return
  }

  // Highly unluckly (someone deleted the page we were editing)
  if (!page.exists()) {
    req.session.notice = 'The page does not exist anymore.'
    res.redirect(proxyPath + '/')
    return
  }

  page.author = req.user.asGitAuthor

  // Test if the user changed the name of the page and try to rename the file
  // If the title is from filename, we cannot overwrite an existing filename
  // If the title is from content, we never rename a file and the problem does not exist
  if (app.locals.config.get('pages').title.fromFilename &&
      page.name.toLowerCase() !== req.body.pageTitle.toLowerCase()) {
    page.renameTo(req.body.pageTitle)
        .then(savePage)
        .catch(function (ex) {
          errors = [{
            param: 'pageTitle',
            msg: 'A page with this name already exists.',
            value: ''
          }]
          fixErrors()
        })
  } else {
    savePage()
  }

  function savePage () {
    page.title = req.body.pageTitle
    page.content = req.body.content
    page.save(req.body.message).then(function () {
      page.unlock()

      if (page.name === '_footer') {
        components.expire('footer')
      }

      if (page.name === '_sidebar') {
        components.expire('sidebar')
      }

      req.session.notice = 'The page has been updated. <a href="' + page.urlForEdit() + '">Edit it again?</a>'
      res.redirect(page.urlForShow())
    }).catch(function (err) {
      common.render500(res, err)
    })
  }

  function fixErrors () {
    req.session.errors = errors.array()
    // If the req.body is too big, the cookie session-store will crash,
    // logging out the user. For this reason we use the sessionStorage
    // on the client to save the body when submitting
    //    req.session.formData = req.body;
    req.session.formData = {
      pageTitle: req.body.pageTitle,
      message: req.body.message
    }
    res.redirect(page.urlForEditWithError())
  }
}

function _getPagesEdit (req, res) {
  var page = new models.Page(common.getPageName(req))
  var warning

  if (!page.lock(req.user)) {
    warning = 'Warning: this page is probably being edited by ' + page.lockedBy.displayName
  }

  models.repositories.refreshAsync().then(function () {
    return page.fetch()
  }).then(function () {
    if (!req.session.formData) {
      res.locals.formData = {
        pageTitle: page.title,
        content: page.content
      }
    } else {
      res.locals.formData = req.session.formData
      // FIXME remove this when the sessionStorage fallback will be implemented
      if (!res.locals.formData.content) {
        res.locals.formData.content = page.content
      }
    }

    common.showNotices(req, res)

    delete req.session.formData

    res.render('edit', {
      title: app.locals.config.get('application').title + ' – Edit page ' + page.title,
      page: page,
      warning: warning
    })
  })
}

function _getRevert (req, res) {
  var page = new models.Page(common.getPageName(req), req.params.version)

  page.author = req.user.asGitAuthor

  page.fetch().then(function () {
    if (!page.error) {
      page.revert()
      res.redirect(page.urlForHistory())
    } else {
      common.render500(res, page.error)
    }
  })
}

module.exports = router
