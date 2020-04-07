/* eslint-env mocha */
/* global expect */

var fs = require('fs')
var models = require('../../lib/models')

var m

models.use(Git)

describe('Models', function () {
  afterEach(function () {
    m.configOverride()
    Git._content = ''
  })

  function getModel (name, revision) {
    return new models.Page(name, revision)
  }

  describe('Page model', function () {
    it('should initialize the model', function () {
      m = getModel('grazie cara')

      expect(m.name).to.equal('grazie cara')
      expect(m.wikiname).to.equal('grazie cara')
      expect(m.filename).to.equal('grazie cara.md')
      expect(m.relativePathName).to.equal('docs/grazie cara.md')
      expect(m.pathname).to.equal('docs/grazie cara.md')
      expect(m.revision).to.equal('HEAD')
    })

    describe('Remove method', function () {
      it('should delete a file', function (done) {
        m = getModel('verguenza')
        m.remove().then(function () {
          expect(Git.rm.called).to.be.true
          done()
        })
      })
    })

    describe('Rename method', function () {
      it('should not rename if the destination exists', function (done) {
        var stub0 = sinon.stub(fs, 'existsSync').returns(true)
        m = getModel('verguenza')
        m.renameTo('vergogna').catch(function () {
          stub0.restore()
          done()
        })
      })

      it('should rename if the destination does not exist', function (done) {
        m = getModel('verguenza')
        m.renameTo('vergogna').then(function () {
          expect(m.name).to.equal('vergogna')
          expect(m.wikiname).to.equal('vergogna')
          expect(m.filename).to.equal('vergogna.md')
          expect(m.relativePathName).to.equal('docs/vergogna.md')
          expect(m.pathname).to.equal('docs/vergogna.md')
          done()
        })
      })
    })

    describe('Save method', function () {
      it('should save the right content with the default config', function (done) {
        m = getModel('verguenza')
        m.title = 'The huge'
        m.content = 'The verge'
        var stub0 = sinon.stub(fs, 'writeFile').callsArgOn(2, m)
        m.save().then(function (content) {
          expect(content).to.equal('The verge')
          stub0.restore()
          done()
        })
      })

      it('should save the right content with the title in the content', function (done) {
        m = getModel('verguenza')

        m.configOverride({
          pages: {
            title: {
              fromFilename: false,
              fromContent: true
            }
          }
        })

        m.title = 'The huge'
        m.content = 'The verge'
        var stub0 = sinon.stub(fs, 'writeFile').callsArgOn(2, m)
        m.save().then(function (content) {
          expect(content).to.equal('# The huge\nThe verge')
          stub0.restore()
          done()
        })
      })
    })

    describe('UrlFor method', function () {
      it('should generate the correct url for page actions', function () {
        m = getModel('chupito')

        expect(m.urlForShow()).to.equal('/wiki/chupito')
        expect(m.urlForEdit()).to.equal('/pages/edit/chupito')
        expect(m.urlForEditWithError()).to.equal('/pages/edit/chupito?e=1')
        expect(m.urlForEditPut()).to.equal('/pages/chupito')
        expect(m.urlForDelete()).to.equal('/pages/chupito')
        expect(m.urlForNew()).to.equal('/pages/new/chupito')
        expect(m.urlForNewWithError()).to.equal('/pages/new/chupito?e=1')
        expect(m.urlForRevert(123456)).to.equal('/pages/revert/123456/chupito')
        expect(m.urlForHistory()).to.equal('/history/chupito')
        expect(m.urlForCompare("123456..123457")).to.equal('/compare/123456..123457/chupito')
        expect(m.urlForVersion(123456)).to.equal('/version/123456/chupito')
      })

      it('should generate the correct url for page actions with a set proxypath', function () {
        m = getModel('chupito')

        m.configOverride({
          application: {
            proxyPath: 'lovely'
          }
        })

        expect(m.urlForShow()).to.equal('/lovely/wiki/chupito')
        expect(m.urlForEdit()).to.equal('/lovely/pages/edit/chupito')
        expect(m.urlForEditWithError()).to.equal('/lovely/pages/edit/chupito?e=1')
        expect(m.urlForEditPut()).to.equal('/lovely/pages/chupito')
        expect(m.urlForDelete()).to.equal('/lovely/pages/chupito')
        expect(m.urlForNew()).to.equal('/lovely/pages/new/chupito')
        expect(m.urlForNewWithError()).to.equal('/lovely/pages/new/chupito?e=1')
        expect(m.urlForRevert(123456)).to.equal('/lovely/pages/revert/123456/chupito')
        expect(m.urlForHistory()).to.equal('/lovely/history/chupito')
        expect(m.urlForCompare("123456..123457")).to.equal('/lovely/compare/123456..123457/chupito')
        expect(m.urlForVersion(123456)).to.equal('/lovely/version/123456/chupito')
      })
    })

    describe('isIndex method', function () {
      it('should test the correct value for the index', function () {
        m = getModel('pisquanio')

        m.configOverride({
          pages: {
            index: 'pisquanio'
          }
        })

        expect(m.isIndex()).to.be.true
      })
    })

    describe('isFooter method', function () {
      it('should test the correct value for the footer', function () {
        m = getModel('_footer')

        expect(m.isFooter()).to.be.true
      })
    })

    describe('isSidebar method', function () {
      it('should test the correct value for the sidebar', function () {
        m = getModel('_sidebar')

        expect(m.isSidebar()).to.be.true
      })
    })

    describe('lock method', function () {
      it('should lock a page', function () {
        m = getModel('panchovilla')

        var l = m.lock({
          asGitAuthor: 'geronimo@somewhere.com'
        })

        expect(l).to.be.true
        expect(m.lockedBy.asGitAuthor).to.equal('geronimo@somewhere.com')

        l = m.lock({
          asGitAuthor: 'someoneelse@somewhere.com'
        })

        expect(l).to.be.false
        expect(m.lockedBy.asGitAuthor).to.equal('geronimo@somewhere.com')
      })
    })

    describe('unlock method', function () {
      it('should unlock a page', function () {
        m = getModel('panchovilla')

        m.lock({
          asGitAuthor: 'geronimo@somewhere.com'
        })

        m.unlock()

        expect(m.lockedBy).to.equal(null)
      })
    })

    describe('fetchContent method', function () {
      it('should fetch the content for a page with no content retrieved', function (done) {
        m = getModel('panchovilla')

        m.fetchContent().then(function () {
          expect(m.content).to.equal('')
          expect(m.rawContent).to.equal('')
          expect(m.title).to.equal(m.name)
          done()
        })
      })

      it('should fetch the content for a page with content retrieved 1', function (done) {
        Git._content = 'Bella giornata!'

        m = getModel('panchovilla')

        m.fetchContent().then(function () {
          expect(m.content).to.equal('Bella giornata!')
          expect(m.rawContent).to.equal('Bella giornata!')
          expect(m.title).to.equal(m.name)
          done()
        })
      })

      it('should fetch the content for a page with content retrieved 2', function (done) {
        // Not the convention for title in the content
        Git._content = 'Bella serata!'

        m = getModel('panchovilla')

        m.configOverride({
          pages: {
            title: {
              fromFilename: false,
              fromContent: true
            }
          }
        })

        m.fetchContent().then(function () {
          expect(m.content).to.equal('Bella serata!')
          expect(m.rawContent).to.equal('Bella serata!')
          expect(m.title).to.equal(m.name)
          done()
        })
      })

      it('should fetch the content for a page with content retrieved 3', function (done) {
        // Convention for title in the content
        Git._content = '# A nice title\nand some content!'

        m = getModel('panchovilla')

        m.configOverride({
          pages: {
            title: {
              fromFilename: false,
              fromContent: true
            }
          }
        })

        m.fetchContent().then(function () {
          expect(m.content).to.equal('and some content!')
          expect(m.rawContent).to.equal('# A nice title\nand some content!')
          expect(m.title).to.equal('A nice title')
          done()
        })
      })
    })
  })
})
