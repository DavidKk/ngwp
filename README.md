[![GitHub version](https://badge.fury.io/gh/DavidKk%2Fngwp.svg)](https://badge.fury.io/gh/DavidKk%2Fngwp)
[![npm version](https://badge.fury.io/js/ngwp.svg)](https://badge.fury.io/js/ngwp)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

[![Build Status](https://travis-ci.org/DavidKk/ngwp.svg?branch=master)](https://travis-ci.org/DavidKk/ngwp)
[![Build status](https://ci.appveyor.com/api/projects/status/p76hetxe0us38axx?svg=true)](https://ci.appveyor.com/project/DavidKk/ngwp)
[![Coverage Status](https://coveralls.io/repos/github/DavidKk/ngwp/badge.svg?branch=master)](https://coveralls.io/github/DavidKk/ngwp?branch=master)
[![Dependency Status](https://dependencyci.com/github/DavidKk/ngwp/badge)](https://dependencyci.com/github/DavidKk/ngwp)


# Project Information

## Install

```
$ npm install -g ngwp
```


## Example

[https://github.com/DavidKk/ngwp-example](https://github.com/DavidKk/ngwp-example)


## Nginx config file generation and import

Config file in project, [.ngwprc.json](https://github.com/DavidKk/ngwp-example/blob/master/.ngwprc.json)

```
$ vi project/.ngwprc.json
$ ngwp nginx
```

# Features

## Multiple Modules

You can define multiple entry/modules in folder [src/modules/](https://github.com/DavidKk/ngwp-example/tree/master/src/modules). Different modules must define different nginx configurations, see [.ngwprc.json](https://github.com/DavidKk/ngwp-example/blob/master/.ngwprc.json).


## Image Sprites Auto-Generate

Put all image-sprites to folder [src/assets/sprites/images/](https://github.com/DavidKk/ngwp-example/tree/master/src/assets/sprites/images), it will combine them to only one image (`dist/path/assets/panels/sprite.{hashcode}.png`).

The base unit is percentage (`%`) not `px` or `rem`. You can change it by file [src/assets/sprites/images/sprite.scss.template.handlebars](https://github.com/DavidKk/ngwp-example/blob/master/src/assets/sprites/images/sprite.scss.template.handlebars)


## SVG Sprites Auto-Generate

Put all svg-sprites to folder [src/assets/sprites/svg/](https://github.com/DavidKk/ngwp-example/tree/master/src/assets/sprites/svg), it will combine them to only one svg (`dist/path/assets/panels/svgsprite.{hashcode}.svg`).

And the SVGO config file is in [src/assets/sprites/svg/svgstore.config.js](https://github.com/DavidKk/ngwp-example/blob/master/src/assets/sprites/svg/svgstore.config.js)

### Compatibility must be known:

```
svg in webkit old browser, it not support use (reference)
it must use '<use xlink:href="url#id"></use>'
and because svgo(https://github.com/svg/svgo) do not set
'xmlns:xlink="http://www.w3.org/1999/xlink"', so it make
origin svg content with use tag lack 'namespace' 'prefix',
and it make svg display success.

Error Code:
This page contains the following errors:
error on line 1 at column 15734: Namespace prefix xlink for href on use is not defined
Below is a rendering of the page up to the first error.
Browser: Chrome 48.0.2564.23:
Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N)
AppleWebKit/537.36 (KHTML, like Gecko)
Chrome/48.0.2564.23
Mobile Safari/537.36
wechatdevtools/0.7.0
MicroMessenger/6.3.22
webview/0

Docs : https://github.com/svg/svgo/blob/master/docs/how-it-works/en.md#3-plugins
API  : https://github.com/svg/svgo/blob/master/docs/how-it-works/en.md#32-api
```
