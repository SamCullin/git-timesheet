[![Build & Release](https://github.com/samcullin/git-timesheet/actions/workflows/publish.yml/badge.svg?branch=main)](https://github.com/samcullin/git-timesheet/actions/workflows/publish.yml)
[![npm version](https://badge.fury.io/js/git-timesheet.svg)](https://badge.fury.io/js/git-timesheet)
[![GitHub Release](https://img.shields.io/github/v/release/samcullin/git-timesheet)](https://github.com/samcullin/git-timesheet/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/samcullin/git-timesheet/graphs/commit-activity)
[![Downloads](https://img.shields.io/npm/dm/git-timesheet.svg)](https://www.npmjs.com/package/git-timesheet)
[![GitHub issues](https://img.shields.io/github/issues/samcullin/git-timesheet.svg)](https://github.com/samcullin/git-timesheet/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](https://makeapullrequest.com)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/samcullin)

# Git Timesheet

A tool to generate timesheets from git history

## Features

- Generate timesheets from git commit history
- Customizable date ranges & windows
- Support for multiple output formats (PRs welcome)
- Support for multiple vcs (PRs welcome)
- Supports multiple repositories


## TODOs (looking for help)
- Workspace and project grouping 
- User and team grouping


## Installation

```bash
bun add -g @samcullin/git-timesheet
npm install -g @samcullin/git-timesheet
pnpm install -g @samcullin/git-timesheet
yarn add global @samcullin/git-timesheet
```

## Usage

```bash
git-timesheet -h
```
```log
Usage: git-timesheet [options] [command]

Generate timesheet reports from git history

Options:
  -V, --version            output the version number
  -s, --start-date <date>  Start date (YYYY-MM-DD)
  -e, --end-date <date>    End date (YYYY-MM-DD)
  -w, --window <window>    Time window (e.g., 1d, 1w, 1m, 1y)
  -f, --format <format>    Output format (markdown, json, html)
  -r, --repo <path>        Repository path (defaults to current directory)
  -h, --help               display help for command

Commands:
  repo
  author
  show                     Show current configuration
```

```bash
git-timesheet --window 1w
```

For more detailed usage instructions and options, see our [documentation](https://github.com/samcullin/git-timesheet#documentation).

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.




