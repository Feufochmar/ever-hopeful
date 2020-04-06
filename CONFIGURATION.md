# Configuration options


#### application.title (string: "Ever-Hopeful")

  Title of the wiki website. This will be showed on the upper left corner of all the pages, in the main toolbar.

#### application.logo (string: "")

  Supply the full URL to an image to be shown as the logo of your wiki. It will appear on the left of the page title in the navigation bar. Just set the `application.title` to an empty string to only show the Logo image. Please note that Ever-Hopeful does not resize the image in any way (you can do it yourself using a custom CSS of course).

#### application.favicon (string: "")

  Supply the full URL to an image to be shown as the favicon of your wiki. Please note that Ever-Hopeful will try to get the mime type of the image from its extension (this can easily fail for a lot of reasons).

#### application.repository (string: "")

  Absolute path for your documents repository (mandatory).

#### application.docSubdir (string: "docs")

  The name of the directory inside which the documents reside.

#### application.uploadSubdir (string: "uploads")

  The name of the directory inside which the uploaded files reside.

#### application.remote (string: "")

  This is the name of the remote you want to push/pull to/from (optional). You can also specify a specific branch using the syntax “remotename branchname”. If you don’t specify a branch, Ever-Hopeful will use master.

#### application.pushInterval (integer: 30)

  Ever-Hopeful will try to push to the remote (if present) every XX seconds.

#### application.secret (string: "change me")

  A string to be used to crypt the session cookie and the local passwords.

#### application.git (string: "git")

  You can specify a different git binary, if you use more than one in your system.

#### application.skipGitCheck (boolean: false)

  Ever-Hopeful will refuse to start if a version of git is found which is known to be problematic. You can still force it to start anyway, providing `true` as the value for this option.

#### application.loggingMode (integer: 1)

  Specifies how verbose the http logging should be. Accepts numeric values: `0` for no logging at all, `1` for the a combined log and `2` for a coincise, coloured log (good for development).

#### application.gfmBreaks (boolean: true)

  Enable [GFM line breaks](https://help.github.com/articles/github-flavored-markdown#newlines)

#### application.proxyPath (string: "")

  If you want ever-hopeful to work "behind" another website (for example in a /wiki directory of an already existing intranet), you need to configure it to be aware of that situation so that it can write all the outbound URLs accordingly. Use this option to pass it the name of the directory that you've configured in your proxy_pass option in nginx or apache. See also an nginx example in the /etc directory of the ever-hopeful source distribution.

  Please note that ever-hopeful won't work correctly if this option is activated.

#### authentication.staticWhitelist (string: "/\\.png$/i, /\\.jpg$/i, /\\.gif$/i")

  This is to enable ever-hopeful to serve any kind of static file (like images) from the repository. By default, Ever-Hopeful will serve `*.md` files and `*.jpg, *.png, *.gif`. Provide the values as a comma separated list of regular expressions.

#### authentication.google.enabled (boolean: true)

  Enable or disable authentication via Google logins.

#### authentication.google.clientId
#### authentication.google.clientSecret

  Values required for Google OAuth2 authentication. Refer to a previous section of this document on how to set them up.

#### authentication.google.redirectUrl (string: /oauth2callback)

  Specifies a custom redirect URL for OAuth2 authentication instead of the default.

#### authentication.github.enabled (boolean: false)

  Enable or disable authentication via Github logins.

#### authentication.github.clientId
#### authentication.github.clientSecret

  Values required for GitHub OAuth2 authentication. Refer to a previous section of this document on how to set them up.

#### authentication.github.redirectUrl (string: /auth/github/callback)

  Specifies a custom redirect URL for OAuth2 authentication instead of the default.

#### authentication.mastodon.enabled (boolean: false)

  Enable or disable authentication via Mastodon logins.

#### authentication.mastodon.clientId
#### authentication.mastodon.clientSecret

  Values required for Mastodon OAuth2 authentication. Refer to a previous section of this document on how to set them up.

#### authentication.mastodon.domain

  Instance of Mastodon used to authenticate logins.

#### authentication.mastodon.redirectUrl (string: /auth/mastodon/callback)

  Specifies a custom redirect URL for OAuth2 authentication instead of the default.

#### authentication.ldap.enabled (boolean: false)

  Enable or disable authentication via LDAP logins
  Requires manual installation of `passport-ldapauth` module via npm.

#### authentication.ldap.url
#### authentication.ldap.bindDn
#### authentication.ldap.bindCredentials
#### authentication.ldap.searchBase
#### authentication.ldap.searchFilter
#### authentication.ldap.searchAttributes

#### authentication.local.enabled (boolean: false)

  The Local setup allows you to specify an array of username/password/email elements that will have access to the Wiki. All the accounts must resides in the configuration `authentication.local.accounts` array.

#### authentication.local.[accounts].username

  Provide any username you like, as a string.

#### authentication.local.[accounts].passwordHash

  Use an hash of your password. Create the hash with `ever-hopeful -# yourpassword`.

#### authentication.local.[accounts].email

  If you want to use Gravatar, provide your gravatar email here.

#### features.gravatar (boolean: true)

  Whether to enable gravatar support or not.

#### features.useProfileUrl (boolean: false)

  If set to true, the URL of the user's profile is used as the email of git commits, and are used to display a link to the author.
  This option is not compatible with gravatar support.

#### server.hostname

  This is the hostname used to build the URL for your wiki pages. The reason for these options to exist is due to the need for the OAuth2 authentication to work (it needs an endpoint to get back to).

#### server.port

  Ever-Hopeful will listen on this port.

#### server.localOnly

  Set this to `true` if you want to accept connection only _from_ localhost (default false).

#### server.CORS.enabled (boolean: false)

  Enable or disable CORS headers for accessing a page through an ajax call from an origin which is not the one which serves Ever-Hopeful. Use this option if for example you want to embed a (rendered) page inside a page of another website.

  The configuration options for CORS are at the moment quite limited: via an Ajax call you can only read (GET) a wiki page (that is, the /wiki/NameOfYourPage path), or issue a search. Once you enable this option, all the wiki page will be accessible. Please note that no authentication check is made, which means that the Ajax calls will be denied if the `anonRead` configuration option will be `false` (all or nothing).

  You can also white-list origin via the following option (CORS.allowedOrigin).

#### server.CORS.allowedOrigin (string: "*")

  Set the allowed origin for your CORS headers. All the Ajax calls to the wiki pages must come from this origin or they will be denied. The default is "*", which means that all the origins will be allowed.

#### server.baseUrl

  The baseUrl is usually automatically generated by Ever-Hopeful (with "//" + hostname + ":" + port), but if for some reason you need to override it, you can use this option.

#### authorization.anonRead (boolean: true)

  Enables/disables the anonymous access to the wiki content.

#### authorization.validMatches (string: ".+")

  This is a regular expression which will be used against the user email account to be able to access the wiki. By default all emails are OK, but you can for example set a filter so that only the hostname from your company will be allowed access.

#### authorization.emptyEmailMatches (boolean: false)

  If the endpoint doesn't provide the email address for the user, allow empty emails to authenticate anyway. Note that GitHub authentication usually requires this to be `true` (unless all wiki users have public email addresses on their GitHub accounts).

#### pages.index (string: "Home")

  Defines the page name for the index of the wiki.

#### pages.title.fromFilename (boolean: true)

  If this is true, the title of each page will be derived from the document's filename. This is how Gollum works. An important consequence of this behavior is that now Ever-Hopeful is able _to rename_ documents (according to the new name it will be eventually given to), while previously it was impossible.

#### pages.title.fromContent (boolean: false)

  If this is true, the title of the document will be part of the document itself (the very first line). If set to true, `fromFilename` should be false.

#### pages.title.asciiOnly (boolean: false)

  If this is set to true, Ever-Hopeful will convert any non-Ascii character present in the title of the document to an ASCII equivalent (using the transliteration module), when creating the filename of the document.

#### pages.title.lowercase (boolean: false)

  If this is set to true, Ever-Hopeful will lowercase any character of the title when creating the filename.

#### pages.title.itemsPerPage (integer: 10)

  This defines how many page item to show in the "list all page" page. Keep this value as low as possible for performance reasons.

#### customizations.sidebar (string: "_sidebar.md")

  Defines the name for the _sidebar_ component. Defaults to `_sidebar.md`. Please note that if you need to use a wiki coming from Github, this name should be set to `_Sidebar`

#### customizations.footer (string: "_footer.md")

  Defines the name for the _footer_ component. Defaults to `_footer.md`. Please note that if you need to use a wiki coming from Github, this name should be set to '_Footer'

#### customizations.style (string: "_style.md")

  Defines the name for the customized _style_ CSS component. Defaults to `_style.css`.

#### customizations.script (string: "_script.md")

  Defines the name for the customized _script_ JavaScript component. Defaults to `_script.js`.
