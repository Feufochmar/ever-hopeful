var fs = require('fs')
var yaml = require('js-yaml')
var _ = require('lodash')

module.exports = (function () {
  var config
  var error = ''

  return {

    load: function (filename) {
      this.setup(yaml.load(fs.readFileSync(filename).toString()))

      if (!config.application || !config.server) {
        error = 'Missing `application` or `server` config section.'
        return false
      }

      // Find any alien configuration options section
      var aliens = _.difference(Object.keys(config), Object.keys(this.defaults))
      if (aliens.length > 0) {
        error = 'Unrecognized section name(s) ' + aliens.join(',')
        return false
      }

      // Find any alien configuration options section name
      var keys = Object.keys(this.defaults)
      for (var i = 0; i < keys.length; i++) {
        if (typeof config[keys[i]] === 'undefined') {
          continue
        }
        aliens = _.difference(Object.keys(config[keys[i]]), Object.keys(this.defaults[keys[i]]))
        if (aliens.length > 0) {
          error = 'Unrecognized configuration option(s) ' + aliens.join(',') + ' in section ' + keys[i]
          return false
        }
      }

      return true
    },

    getError: function () {
      return error
    },

    defaults: {

      application: {
        title: 'Ever-Hopeful',
        logo: '',
        favicon: '',
        repository: '',
        docSubdir: 'docs',
        uploadSubdir: 'uploads',
        remote: '',
        pushInterval: 30,
        secret: 'change me',
        git: 'git',
        skipGitCheck: false,
        loggingMode: 1,
        gfmBreaks: true,
        proxyPath: ''
      },

      authentication: {
        google: {
          enabled: true,
          clientId: 'replace me with the real value',
          clientSecret: 'replace me with the real value',
          redirectURL: ''
        },
        github: {
          enabled: false,
          clientId: 'replace me with the real value',
          clientSecret: 'replace me with the real value',
          redirectURL: ''
        },
        mastodon: {
          enabled: false,
          clientId: 'replace me with the real value',
          clientSecret: 'replace me with the real value',
          domain: 'your.mastodon.instance',
          redirectURL: ''
        },
        ldap: {
          enabled: false,
          url: 'ldap://example.org:389',
          bindDn: '',
          bindCredentials: '',
          searchBase: 'ou=people,dc=example,dc=org',
          searchFilter: '(uid={{username}})',
          searchAttributes: ''
        },
        local: {
          enabled: false,
          accounts: [{
            username: '',
            passwordHash: '',
            email: ''
          }]
        }
      },

      features: {
        useProfileUrl: false
      },

      server: {
        hostname: 'localhost',
        port: process.env.PORT || 6067,
        localOnly: false,
        baseUrl: '',
        CORS: {
          enabled: false,
          allowedOrigin: '*'
        }
      },

      authorization: {
        anonRead: true,
        validMatches: '.+',
        emptyEmailMatches: false
      },

      // Please note that the combination of "from filename" and "ascii only"
      // is not really an valid option (information will be probably lost regarding
      // non ASCII only caracters)
      pages: {
        index: 'Home',
        title: {
          fromFilename: true,
          fromContent: false,
          asciiOnly: false,
          lowercase: false
        },
        itemsPerPage: 10
      },

      customizations: {
        sidebar: '_sidebar.md',
        footer: '_footer.md',
        style: '_style.css',
        script: '_script.js'
      }
    },

    // Ensure that all the key will have a sane default value
    validate: function () {
      config.application = _.extend({}, this.defaults.application, config.application)
      config.application.pushInterval = (parseInt(config.application.pushInterval, 10) | 0)

      config.authentication = _.extend({}, this.defaults.authentication, config.authentication)

      if (!config.authentication.google.enabled &&
        !config.authentication.github.enabled &&
        !config.authentication.mastodon.enabled &&
        !config.authentication.ldap.enabled &&
        !config.authentication.local.enabled
      ) {
        error = 'No authentication method provided.'
        return false
      }

      if (config.authentication.google.enabled && (!config.authentication.google.clientId || !config.authentication.google.clientSecret)) {
        error = 'Invalid or missing authentication credentials for Google (clientId and/or clientSecret).'
        return false
      }

      if (config.authentication.github.enabled && (!config.authentication.github.clientId || !config.authentication.github.clientSecret)) {
        error = 'Invalid or missing authentication credentials for Github (clientId and/or clientSecret).'
        return false
      }

      if (config.authentication.mastodon.enabled && (!config.authentication.mastodon.clientId || !config.authentication.mastodon.clientSecret || !config.authentication.mastodon.domain)) {
        error = 'Invalid or missing authentication credentials for Mastodon (clientId and/or clientSecret and/or domain).'
        return false
      }

      if (config.authentication.ldap.enabled && (!config.authentication.ldap.url || !config.authentication.ldap.searchBase || !config.authentication.ldap.searchFilter)) {
        error = 'Invalid or missing config for LDAP (url and/or searchBase and/or searchFilter).'
        return false
      }

      config.features = _.extend({}, this.defaults.features, config.features)

      config.server = _.extend({}, this.defaults.server, config.server)

      config.authorization = _.extend({}, this.defaults.authorization, config.authorization)

      config.pages = _.extend({}, this.defaults.pages, config.pages)

      if (!config.pages.title.fromFilename && !config.pages.title.fromContent) {
        config.pages.title.fromFilename = true
      }

      if (config.pages.title.fromFilename && config.pages.title.fromContent) {
        error = 'Page title configuration "fromFilename" and "fromContent" are both set to true, while they are incompatible.'
        return false
      }

      config.customizations = _.extend({}, this.defaults.customizations, config.customizations)

      return true
    },

    get: function (key, useDefaults) {
      if (!config && !useDefaults) {
        throw new Error('The configuration has not been read and cannot be `get`')
      }

      if (!config && useDefaults) {
        return this.defaults[key]
      }

      if (typeof key === 'undefined') {
        return config
      }

      return config[key]
    },

    getProxyPath: function (override) {
      var path = (override || this.get('application', true).proxyPath).trim()

      // @TODO make sure the path is something that makes sense (?)
      if (path.length === 0 || path === '/') {
        return ''
      }

      if (path.charAt(0) !== '/') {
        path = '/' + path
      }

      return path
    },

    // Manually set the config to the setup value
    setup: function (setup) {
      config = setup
    },

    // Dumps a sample config file
    sample: function () {
      var defs = _.clone(this.defaults)

      return '---\n' +
        '# Configuration sample file for Ever-Hopeful (YAML)\n' +
        yaml.dump(defs)
    }
  }
}())
