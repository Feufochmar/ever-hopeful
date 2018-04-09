# Contributing to Ever-Hopeful

Some things to keep in mind if you want to contribute.

## Document the configuration options

If you add, change or remove configuration options, also update the README.md.

## Use standardjs for formatting

To install standardjs:
`yarn global add standard`
Run `standard` in the root directory and check for errors.

## Run the tests

This projet have unit tests.
Run `yarn test` to check you didn't break anything. Update the tests if needed

## Running

- Run ever-hopeful once with the `-s` command line parameter. Redirect the output to a configuration file: `./ever-hopeful -s > config.yaml`
- If you don't want to use the Google authentication (which is enabled by default), run `ever-hopeful -# something` to create an hash for "something" and use it in the config file for the local authentication mechanism
- Create an empty git repository accessible by ever-hopeful and point its configuration file's `repository` to it: `mkdir my-wiki; cd wiki; git init`
- Maybe you want to set the `loggingMode` to 2 (less verbose, more compact output) in the config
- Run ever-hopeful in development mode (ever-hopeful will automatically restart when a file changes): `yarn run start-dev`
- Start hacking :)
