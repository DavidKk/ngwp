[![Build Status](https://travis-ci.org/DavidKk/webpack-angular.svg?branch=master)](https://travis-ci.org/DavidKk/webpack-angular)
[![Build status](https://ci.appveyor.com/api/projects/status/njpg463prkj2kg8d?svg=true)](https://ci.appveyor.com/project/DavidKk/webpack-angular)
[![Coverage Status](https://coveralls.io/repos/github/DavidKk/webpack-angular/badge.svg)](https://coveralls.io/github/DavidKk/webpack-angular)
[![Dependency Status](https://dependencyci.com/github/DavidKk/webpack-angular/badge)](https://dependencyci.com/github/DavidKk/webpack-angular)

# Project Information

## Install

```
# Install NodeJS NPM
$ sudo apt-get install node npm

# Update NodeJS (Linux, OSX)
$ npm install -g n
$ n 6.2.2 (or latest)

# Update NPM
$ npm install -g npm

# Update NodeJS 6.2.2 or latest
$ npm install -g n
$ n use stable

# Change npm registries (China)
# docs: https://github.com/Pana/nrm
$ npm install -g nrm
$ nrm use taobao(cnpm)

# Install node_modules
$ cd /path/to/project
$ npm install --verbose

# node-sass need to compile and will spend much time, please be patient.
```

## Nginx config file generation and import

```
# Generate nginx config file
$ ./bin/vhost
# or
$ npm run vhost

# Import nginx config file
$ echo "include /path/to/project/vhosts/nginx.conf;" >> /path/to/nginx/nginx.conf

# Reset nginx
# Linux
$ sudo service nginx restart
# OSX
$ sudo brew services restart nginx
```

## Compile and release

```
# Develop env
$ npm start

# Running test
$ npm test

# Release project
$ npm run release
```

## Modules and routers

```
# Generate routers
$ ./bin/module router module/componentA/componentB/...
```

Regenerate nginx config file when generate new module, and reload/reset ngxin server.


# Features

## Mutiple Modules (Mutiple Entrance)

Define a module, you can make folder in entry folder (`src/app/`). The folder name is module name.
and every module must has one entrnace script file (must be named 'index.js'). And you can open `www.domain.com/{module_name}/` to visit that module.

It provides the run-script for you to generate module easier.

```
$ npm run module router moduleName
# see above
```

At last, every time for build new module, you must generate nginx config, because the base-router is defined by nginx configuration.


## Image Sprites Auto-Generate

Put all image-sprites to folder `src/assets/sprites/images/`, the webpack will combine them into one sprite-image (`dist/path/panels/sprite.{hashcode}.png`).

And it also generate the scss file to temporary folder (`.temporary/`), and you can importd use `@import "sprites"`. the base unit is percentage (`%`) not `px` or `rem`. you can change it by file `src/assets/sprites/images/sprite.scss.template.handlebars`

## SVG Sprites Auto-Generate

Put all svg-sprites to folder `src/assets/sprites/svg/`, the webpack will combine them into one sprite-image (`dist/path/panels/svgsprite.{hashcode}.svg`).

And the SVGO config file is in `src/assets/sprites/svg/svgstore.config.js`


# Specification

## ES6 Overwrites each script

All the javascript file (include configuration files), you must use babel-es6. And must be followed the eslint standard (`.eslintrc`)

## Use SASS

The stylesheet must be followed the stylelint standard (`.stylelintrc`).
