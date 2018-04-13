/* global Git */

var router = require('express').Router()
var path = require('path')
var corsEnabler = require('../lib/cors-enabler')
var models = require('../lib/models')

models.use(Git)

router.options('/search', corsEnabler)
router.get('/search', corsEnabler, _getSearch)

function _getSearch (req, res) {
  var record
  var pages = new models.Pages()

  res.locals.matches = []

  if (req.query.term) {
    res.locals.term = req.query.term.trim()
  } else {
    res.locals.term = ''
  }

  if (res.locals.term.length === 0) {
    renderResults()
    return
  }

  if (res.locals.term.length < 2) {
    res.locals.warning = 'Search string is too short.'
    renderResults()
  } else {
    try {
      new RegExp(res.locals.term) // eslint-disable-line no-new
    } catch (e) {
      res.locals.warning = 'The format of the search string is invalid.'
      renderResults()
      return
    }

    pages.findString(res.locals.term, function (err, items) {
      items.forEach(function (item) {
        if (item.pageName.trim() !== '') {
          res.locals.matches.push(item)
        }
      })
      renderResults()
    })
  }

  function renderResults () {
    res.render('search', {
      title: 'Search results'
    })
  }
}

module.exports = router
