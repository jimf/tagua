# tagua

An incremental [ctags][] file generator.

## Goals

- __Fast__. Generating a new tags file shouldn't feel sluggish. Likewise, the
  output should be sorted to optimize usage by the code editor.
- __Incremental__. The tags file should always be up-to-date, even as code is
  modified.
- __Resilient__. In addition to updating files, add and deleting files should
  update the tags file as one would expect, including when switching between
  git branches.
- __Targetted__. I primarily work in the front end web application ecosystem.
  As such, it's only important to me that this project supports languages in
  that space. I may always add additional parsers down the line, or expose an
  API for plugging in arbitrary parsers, but this isn't a primary goal at this
  time.

## Supported languages

- JavaScript (including modern syntax and JSX)
- SCSS

## Installation

Install using [npm][]:

    npm install jimf/tagua

## Usage

__tagua__ will generally be used from the command line to generate a tags file
for a project.

### Command-line options

- `--help, -h`: Show help information and exit.
- `--log-level=LEVEL`: Set the log level, which is one of `trace`, `debug`,
  `info` (default), `warn`, or `error`.
- `--output=FILE`: File to write output to. Defaults to stdout for single-run
  mode, and `tags` in the current working directory in watch mode.
- `--watch`: Watch files for changes and update the tags file accordingly.
- `--version`: Show the currently installed tagua version and exit.

### Single-run mode

Not yet implemented.

### Continuous watch mode

__tagua__ can be started in watch mode to watch a file pattern for changes and
rebuild the tags file accordingly:

    tagua --watch 'src/**/*.js'

Take note that the glob is quoted. This is to prevent shell expansion and allow
the watcher to resolve the glob. By doing this, new files that match the glob
will be picked up.

Watch mode writes to a file named `tags` in the current working directory. This
may be overwritten by specifying `--output` with a file path.

## API

Not yet defined. All current API choices should be considered internal.

## Motivation

My text editor of choice is [Vim][], and ctags are incredibly useful for
quickly navigating to the definitions of identifiers. However, the existing
tooling for working with ctags, particularly with large JavaScript projects,
left me wanting more. In my experience, the tags file would quickly get out of
date if not continually updated, but the actual command to regenerate the whole
tags file for the project would take enough time that doing so on write or
commit felt clunky enough for me to eventually stop doing so. The ideal
solution is incremental tag generation that is fast and reliably handles new
files, deleted files, and git branch switching. This project aims to meet those
goals.

## License

MIT

[ctags]: https://en.wikipedia.org/wiki/Ctags
[Vim]: https://www.vim.org/
