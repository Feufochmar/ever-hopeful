/* global Git */
var router = require('express').Router()
var renderer = require('../lib/renderer')
var fs = require('fs')
var models = require('../lib/models')
var common = require('./common')

models.use(Git)

router.get('/misc/syntax-reference', _getSyntaxReference)
router.post('/misc/preview', _postPreview)
router.get('/misc/upload', _getUploadForm)

function _getSyntaxReference (req, res) {
  res.render('syntax')
}

function _postPreview (req, res) {
  res.render('preview', {
    content: renderer.render(req.body.data)
  })
}

function _getUploadForm (req, res) {
  if (res.locals.user) {
    res.render('upload')
  } else {
    common.render404(res)
  }
}

router.all('*', function (req, res) {
  common.render404(res)
})

module.exports = router
