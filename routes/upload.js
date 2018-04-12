/* global Git */

var app = require('../lib/app').getInstance()
var express = require('express')
var multer = require('multer')
var router = express.Router()

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

  var repFileName = req.body.rep_file_name
  var repFile = uploadDirectory + '/' + repFileName
  var gitFile = uploadSubdir + '/' + repFileName

  var tempFile = req.file.path
  var outputMsg = ''

  var fs = require('fs')

  fs.unlink(repFile, function (err) {
    // Nothing special to do if the file we want to write do not exists
    // Move the file to its location
    fs.readFile(tempFile, function (err, data) {
      if (!err) {
        fs.writeFile(repFile, data, function (err) {
          if (!err) {
            // Remove temporary file
            fs.unlink(tempFile, function (err) {
              // Nothing to do if there is an error
              err
            })
            // Add the written file to git
            var gitMsg = req.body.file_message
            if (!gitMsg || gitMsg === '') {
              gitMsg = 'Uploading file (' + gitFile + ')'
            }
            Git.add(gitFile, gitMsg, req.user.asGitAuthor, function (err) {
              if (!err) {
                outputMsg = 'File uploaded to: <pre>/uploads/' + repFileName + '</pre>'
              } else {
                console.warn('Upload: error when commiting file ' + gitFile + ': ' + err)
                outputMsg = 'Error when commiting file ' + repFileName + ': <pre>' + err + '</pre>'
              }
              res.render('upload_status', {message: outputMsg})
            })
          } else {
            console.warn('Upload: error when writing file ' + repFile + ': ' + err)
            outputMsg = 'Error when writing file ' + repFileName + ' to repository: <pre>' + err + '</pre>'
            res.render('upload_status', {message: outputMsg})
          }
        })
      } else {
        console.warn('Upload: error when reading uploaded temporary file' + tempFile + ': ' + err)
        outputMsg = 'Error when reading uploaded file ' + repFileName + ' : <pre>' + err + '</pre>'
        res.render('upload_status', {message: outputMsg})
      }
    })
  })
}

module.exports = router
