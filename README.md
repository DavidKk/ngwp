[![GitHub version](https://badge.fury.io/gh/DavidKk%2Fngwp.svg)](https://badge.fury.io/gh/DavidKk%2Fngwp)
[![npm version](https://badge.fury.io/js/ngwp.svg)](https://badge.fury.io/js/ngwp)
[![Build Status](https://travis-ci.org/DavidKk/ngwp.svg?branch=master)](https://travis-ci.org/DavidKk/ngwp)
[![Build status](https://ci.appveyor.com/api/projects/status/p76hetxe0us38axx?svg=true)](https://ci.appveyor.com/project/DavidKk/ngwp)
[![Coverage Status](https://coveralls.io/repos/github/DavidKk/ngwp/badge.svg?branch=master)](https://coveralls.io/github/DavidKk/ngwp?branch=master)
[![Dependency Status](https://dependencyci.com/github/DavidKk/ngwp/badge)](https://dependencyci.com/github/DavidKk/ngwp)


# Project Information

## Install

```
# For global
$ npm install -g ngwp

# For local
$ npm install ngwp
```

## Initialization

```
$ ngwp init project_name
$ cd project_name
$ npm install
```

## Nginx config file generation and import

```
$ ngwp vhosts --port webpack_develop_server_port (default: 50000, suggest)
```

## Generate modules

```
$ ngwp module module_name
```

Regenerate nginx config file when generate new module, and reload/reset ngxin server.

## Generate router

```
$ ngwp reoute module_name route1/route2/routeN...
```

## Compile and release

```
# Develop env
$ npm start

# Running test
$ npm test

# Release project
$ npm run product
```

## Set develop server domain

```
$ vi project/.ngwprc

{
  port: 51000,
  clientDomain: 'www.domain.com',     // default is your project name: www.[project_name].com
  serverDomain: 'api.domain.com',     // optional it will be inject variables SERVER_DOMAIN
  assetsDomain: 'static.domain.com',  // optional
  uploadDomain: 'upload.domain.com',  // optional
  nginxProxy: [                       // optional
    {
      entries   : ['home', 'user'],
      domain    : ['www.domain.com'],
    },
    {
      entries   : ['payment'],
      domain    : ['pay.domain.com'],
    },
  ],
}
```

`clientDomain`, `serverDomain`, `assetsDomain`, `uploadDomain` will inject to javascript, but it is not in global (`webpack.DefinePlugin`)


# Features

## Mutiple Modules (Mutiple Entrance)

Define a module, you can make folder in entry folder (`src/app/`). The folder name is module name.
and every module must has one entrnace script file (must be named 'index.js'). And you can open `www.domain.com/{module_name}/` to visit that module.

At last, every time for build new module, you must generate nginx config, because the base-router is defined by nginx configuration.


## Image Sprites Auto-Generate

Put all image-sprites to folder `src/assets/sprites/images/`, the webpack will combine them into one sprite-image (`dist/path/panels/sprite.{hashcode}.png`).

And it also generate the scss file to temporary folder (`.temporary/`), and you can importd use `@import "sprites"`. the base unit is percentage (`%`) not `px` or `rem`. you can change it by file `src/assets/sprites/images/sprite.scss.template.handlebars`


## SVG Sprites Auto-Generate

Put all svg-sprites to folder `src/assets/sprites/svg/`, the webpack will combine them into one sprite-image (`dist/path/panels/svgsprite.{hashcode}.svg`).

And the SVGO config file is in `src/assets/sprites/svg/svgstore.config.js`

Compatibility must be known:

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

# Specification

## ES6 Overwrites each script and SASS overwrites each styles

You can create `.eslintrc` or `.stylelintrc` to the root path of project. ngwp will base on your  standard rc-file to check all the scripts and styles.
