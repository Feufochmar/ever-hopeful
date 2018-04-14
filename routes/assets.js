/* global Git */

var app = require('../lib/app').getInstance()
var assets = require('../lib/assets')
var express = require('express')
var common = require('./common')

var router = express.Router()

assets.use(Git)

// Asset configuration
var assetSubdir = app.locals.config.get('application').uploadSubdir
var assetDirectory = app.locals.config.get('application').repository + '/' + assetSubdir
var proxyPath = app.locals.config.getProxyPath()

// Asset directory: serve the files
router.use('/uploads', express.static(assetDirectory))

// Asset management routes
router.get('/assets/list', _listAssets)
router.delete('/assets/*', _deleteAsset)
router.get('/assets/show/*', _showAsset)
router.put('/assets/*', _moveAsset)

// TODO: revert asset
// router.put('/assets/revert/:version/*', _revertAsset)

function _listAssets (req, res) {
  var items = []
  var pagen = 0 | req.query.page

  var allAssets = new assets.Assets()

  allAssets.fetch(pagen).then(function () {
    allAssets.models.forEach(function (asset) {
      if (!asset.error) {
        items.push({
          asset: asset,
          hashes: asset.hashes.length === 2 ? asset.hashes.join('..') : ''
        })
      }
    })

    common.showNotices(req, res)

    res.render('list-assets', {
      items: items,
      title: 'All the assets',
      pageNumbers: Array.apply(null, Array(allAssets.totalPages)).map(function (x, i) {
        return i + 1
      }),
      pageCurrent: allAssets.currentPage
    })
  }).catch(function (ex) {
    console.log(ex)
  })
}

function _deleteAsset (req, res) {
  var asset = new assets.Asset(common.getAssetName(req))

  var redirectURL = proxyPath + '/assets/list'

  asset.author = req.user.asGitAuthor

  asset.remove().then(function () {
    req.session.notice = 'The asset `' + asset.wikiname + '` has been deleted.'
    res.redirect(redirectURL)
  })
}

function _showAsset (req, res) {
  var asset = new assets.Asset(common.getAssetName(req))

  common.showNotices(req, res)

  asset.fetch(false).then(function () {
    res.render('show-asset', {
      title: asset.wikiname,
      asset: asset
    })
  })
}

function _moveAsset (req, res) {
  var asset = new assets.Asset(common.getAssetName(req))

  asset.author = req.user.asGitAuthor
  asset.renameTo(req.body.assetName)
    .then(function () {
      res.redirect(asset.urlForShow())
    }).catch(function (ex) {
      console.log(ex)
      req.session.errors = [{msg: 'Cannot rename file to ' + req.body.assetName}]
      res.redirect(asset.urlForShow())
    })
}

module.exports = router
