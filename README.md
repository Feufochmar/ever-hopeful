# EVER-HOPEFUL

> Where knowledge was found.

A **git based** _wiki engine_ written for **node.js**, with a decent design, a search capability and a good typography.

This project started as a fork of [Jingo](https://github.com/claudioc/jingo) v1.8.5, with breaking changes.

<!-- toc -->

## Table of contents

  * [Features](#features)
  * [Installation](#installation)
  * [Authentication and Authorization](#authentication-and-authorization)
  * [Known limitations](#known-limitations)
  * [Customization](#customization)
  * [Editing](#editing)
  * [Configuration options reference](#configuration-options-reference)

<!-- toc stop -->


## Features

- No database: Ever-Hopeful uses a git repository as the document archive
- Markdown for everything, [github flavored](http://github.github.com/github-flavored-markdown/)
- Ever-Hopeful uses [Codemirror](http://codemirror.net/) as the markup editor, with a nice (ajax) preview
- It provides a "distraction free", almost full screen editing mode
- Revision history for all the pages (with restore)
- Show differences between document revisions
- Paginated list of all the pages, with a quick way to find changes between revisions
- Search through the content _and_ the page names
- Page layout accepts custom sidebar and footer
- Gravatar support
- Generate Table of Contents for pages
- Can use custom CSS and JavaScript scripts
- White list for authorization on page reading and writing
- Detects unwritten pages (which will appear in red)
- Automatically push to a remote (optionally)
- Mobile friendly (based on Bootstrap 3.x)
- Quite configurable, but also works out of the box
- Works well behind a proxy (i.e.: the wiki can be "mounted" as a directory in another website)
- Pages can be embedded into another site
- Authentication via Mastodon, Google, Github, LDAP and local name/password

For code syntax highlighting, Ever-Hopeful uses the `node-syntaxhighlighter` module. For the list of supported languages, please refer to [this page](https://github.com/thlorenz/node-syntaxhighlighter/tree/master/lib/scripts).


## Installation

Download/clone the whole thing and run `yarn install`.

Note: if you already have Ever-Hopeful installed, please also run `yarn prune` (some modules can be stale and need to be removed).

Ever-Hopeful needs a config file and to create a sample config file, just run `ever-hopeful -s`, redirect the output on a file and then edit it (`ever-hopeful -s > config.yaml`). The config file contains all the available configuration options. Be sure to provide a valid server hostname (like wiki.mycompany.com) if you use a 3rd party provider for authentication (like Google or GitHub). It is needed for them to be able to get back to you.

If you define a `remote` to push to, then Ever-Hopeful will automatically issue a push to that remote every `pushInterval` seconds. To declare a `remote` for Ever-Hopeful to use, you'll need to identify the name of your local remote. The following example shows how a local remote is typically defined:

`git remote add origin https://github.com/joeuser/wikirepo.git'`

Based on that example, you would update config.yaml with the remote name "origin" as follows:

`remote: "origin"`

You can also use the `git remote` command to get the name of your remote.

You can also specify a branch using the syntax "remotename branchname". If you don't specify a branch, Ever-Hopeful will use `master`. Please note that before the `push`, a `pull` will also be issued (at the moment Ever-Hopeful will not try to resolve conflicts, though).

The basic command to run the wiki will then be

`ever-hopeful -c /path/to/config.yaml`

Before running ever-hopeful you need to initialise its git repository somewhere (`git init` is enough). Additionally the user running the process needs to have `git config --global user.name` and `git config --global user.email` configured. Else your document's repo will get scrambled and you have to reinitialize it again (`rm -rf .git && git init`).

If you define a remote to push to, be sure that the user who'll push has the right to do so. This means you have to configure the remote via the `git://` URI that uses ssh authentication to push and have [created and published the process user's ssh public key](https://help.github.com/articles/generating-ssh-keys/) to the remote.

If your documents reside in subdirectory of your repository, you need to specify its name using the `docSubdir` configuration option. The `repository` path _must_ be an absolute path pointing to the root of the repository.

If you want your wiki server to only listen to your `localhost`, set the configuration key `localOnly` to true.

## Authentication and Authorization

You can enable the following strategies: _Mastodon logins (OAuth2)_, _Google logins (OAuth2)_, _GitHub logins (OAuth2)_, _ldap logins_ or a simple, locally verified username/password credentials match (called "local").

The strategies using OAuth 2 needs get a `client id` and a `client secret` from the authentication provider. They are available when registering an OAuth 2 application at the provider. Those informations must be put in the configuration file.

**Warning** Some providers do not or do not always return the email associated to a user account. You need to set the `authorization.emptyEmailMatches` configuration option to `true` in this is the case.

The _ldap_ method uses `url` as the ldap server url, and optionally a `bindDn` and `bindCredentials` if needed. The `searchBase` and `searchFilter` are required for searching in the tree. In the configuration `searchAttributes` is also available.
Since we want to install the (binary) support to LDAP only when needed, please _manually_ `yarn install passport-ldapauth` to use the LDAP support.

The _local_ method uses an array of `username`, `passwordHash` and optionally an `email`. The password is hashed using a SHA-512 algorithm. To generate a hash, use the `--hash-string` program option: once you get the hash, copy it in the config file.

You can enable all the authentications options at the same time. The `local` is disabled by default.

The _authorization_ section of the config file has three keys: `anonRead`, `validMatches` and `emptyEmailMatches`.

If `anonRead` is true, then anyone who can access the wiki can read anything. If `anonRead` is false you need to authenticate also for reading and then the email of the user _must_ match at least one of the regular expressions provided via validMatches, which is a comma separated list. There is no "anonWrite", though. To edit a page the user must be authenticated.

`emptyEmailMatches` allows access when remote authentication providers do not provide an email address as part of user data. It defaults to `false`, but will usually need to be set to `true` for GitHub authentication (GitHub only returns email addresses that have been made public on users' GitHub accounts). It must be set to `true` for Mastodon authentication.

The authentication is mandatory to edit pages from the web interface, but ever-hopeful works on a git repository; that means that you could skip the authentication altogether and edit pages with your editor and push to the remote that ever-hopeful is serving.

## Known limitations

- The authentication is mandatory (no anonymous writing allowed).
- Authorization is only based on a regexp'ed white list with matches on the user email address
- There is one authorization level only (no "administrators" and "editors")
- No scheduled pull or fetch from the remote is provided (because handling conflicts would be a bit too... _interesting_)
- There is no removal of empty directories after a page is moved.

Please note that at the moment it is quite "risky" to have someone else, other than ever-hopeful itself, have write access to the remote / branch ever-hopeful is pushing to. The push operation is supposed to always be successfull and there is no pull or fetch. You can of course manage to handle pull requests yourself.

## Customization

You can customize ever-hopeful in four different ways:

- add a left sidebar to every page: just add a file named `_sidebar.md` containing the markdown you want to display to the repository. You can edit or create the sidebar from Ever-Hopeful itself, visiting `/wiki/_sidebar` (note that the title of the page in this case is useless)
- add a footer to every page: the page you need to create is `_footer.md` and the same rules for the sidebar apply
- add a custom CSS file, included in every page as the last file. The default name of the file is `_style.css` and it must reside in the document directory (but can stay out of the repo). It is not possible to edit the file from ever-hopeful itself
- add a custom JavaScript file, included in every page as the last JavaScript file. The default name of the file is `_script.js` and it must reside in the document directory (but can stay out of the repo). It is not possible to edit the file from ever-hopeful itself

All these names are customizable via the `customizations` option in the config file (see [the reference](CONFIGURATION.md)).

Once read, all those files are cached (thus, not re-read for every page load, but kept in memory). This means that for every modification in _style.css and _script.js you need to restart the server (sorry, working on that).

This is not true for the footer and the sidebar but ONLY IF you edit those pages from ever-hopeful (which in that case will clear the cache by itself).

## Editing

To link to another Ever-Hopeful wiki page, use the Wiki Page Link Tag.

    [[Ever-Hopeful Works/More]]

The above tag will create a link to the corresponding page file named `More.md` located in the `Ever-Hopeful Works` sub-directory of the document directory.
If you'd like the link text to be something that doesn't map directly to the page name, you can specify the actual page name after a pipe:

    [[How Ever-Hopeful works more|Ever-Hopeful Works/More]]

The above tag will link to `Ever-Hopeful Works/More.md` using "How Ever-Hopeful Works more" as the link text.

## Images

If you put images into the repository, Ever-Hopeful will be able to serve them. You can enable Ever-Hopeful to serve even other file types from the document directory: you need to change the `staticWhitelist` configuration option.

You can also upload images with ever-hopeful. Those will be placed in an upload directory.

## Configuration options

See [CONFIGURATION.md](CONFIGURATION.md)
