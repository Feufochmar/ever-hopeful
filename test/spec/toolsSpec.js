/* eslint-env mocha */
/* global expect */

var Tools = require('../../lib/tools')

describe('Tools', function () {
  it('should hashify a string with a salt', function () {
    expect(Tools.hashify(
      'tornado',
      'hurricane'
    )).to.equal('3d0ccfb18b53036fac0d42ed4d36d5c6f194bef7cb125cec8dc80d330933e2a02badeafa56bbb3a2c89b4e30015a00460154e11ff040b557379d9a817868f4e7')
  })

  it('should not authorize empty email', function () {
    expect(Tools.isAuthorized('       ')).to.equal(false)
    expect(Tools.isAuthorized('')).to.equal(false)
    expect(Tools.isAuthorized()).to.equal(false)
    expect(Tools.isAuthorized(null)).to.equal(false)
  })

  it("should authorize with 'no.email.user'", function () {
    expect(Tools.isAuthorized('no.email.user')).to.equal(false)
    expect(Tools.isAuthorized('no.email.user', '', true)).to.equal(true)
    expect(Tools.isAuthorized('no.email.user', '', false)).to.equal(false)
  })

  it('should authorize with empty pattern', function () {
    expect(Tools.isAuthorized('claudio.cicali@gmail.com')).to.equal(true)
    expect(Tools.isAuthorized('claudio.cicali@gmail.com', null)).to.equal(true)
    expect(Tools.isAuthorized('claudio.cicali@gmail.com', '')).to.equal(true)
  })

  it("should not authorize if email doesn't seems an email", function () {
    expect(Tools.isAuthorized('zumpa', '.*')).to.equal(false)
    expect(Tools.isAuthorized('zumpa@', '.*')).to.equal(false)
    expect(Tools.isAuthorized('zumpa@.com', '.*')).to.equal(false)
    expect(Tools.isAuthorized('@zumpa', '.*')).to.equal(false)
  })

  it('should not authorize if the pattern is an invalid regexp', function () {
    expect(Tools.isAuthorized('zumpa@zot.com', '*')).to.equal(false)
  })

  it("should not authorize if email doesn't match a pattern", function () {
    expect(Tools.isAuthorized('zumpa@zot.com', 'saaa.*')).to.equal(false)
    expect(Tools.isAuthorized('zumpa@zot.com', '.*@google\.com')).to.equal(false) // eslint-disable-line
    expect(Tools.isAuthorized('zumpa@zot.com', '.*@zot\.it')).to.equal(false) // eslint-disable-line
  })

  it('should authorize if email matches a pattern', function () {
    expect(Tools.isAuthorized('zumpa@zot.com', '.*')).to.equal(true)
    expect(Tools.isAuthorized('zumpa@zot.com', 'zumpa.*')).to.equal(true)
    expect(Tools.isAuthorized('zumpa@zot.com', '.*@zot.com,.*@zot.it')).to.equal(true)
    expect(Tools.isAuthorized('zumpa@zot.com', 'google.com,.*@zot.com,.*@zot.it')).to.equal(true)
    expect(Tools.isAuthorized('zumpa@zot.com', 'google.com,.*@zot.org        ,  .*@zot.com')).to.equal(true)
  })
})
