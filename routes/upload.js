/* global Git */

var app = require('../lib/app').getInstance()
var assets = require('../lib/assets')
var express = require('express')
var multer = require('multer')
var router = express.Router()

assets.use(Git)

// File Uploads
var uploadSubdir = app.locals.config.get('application').uploadSubdir
var uploadDirectory = app.locals.config.get('application').repository + '/' + uploadSubdir
var upload = multer({ dest: uploadDirectory + '/' })

// Routes
// Upload directory: serve the files
router.use('/uploads', express.static(uploadDirectory))
router.post('/uploadFile', upload.single('wiki_file'), _uploadFile)

function _uploadFile(req, res, next) {
  if (!res.locals.user) {
    return
  }

  if (req.body.rep_file_name === '') {
    res.render('upload_status', {message: 'Filename cannot be empty.'})
    return
  }

  var asset = new assets.Asset(req.body.rep_file_name)
  asset.author = req.user.asGitAuthor

  asset.save(req.file.path, req.body.file_message).then(function () {
    res.render('upload_status', {message: 'File uploaded to: <pre>' + asset.urlForShow() + '</pre>'})
  }).catch(function (err) {
    res.render('upload_status', {message: 'Error: ' + err})
  })
}

module.exports = router
