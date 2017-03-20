import fs             from 'fs-extra';
import path           from 'path';
import async          from 'async';
import { Server }     from 'karma';
import { initialize } from '../src/libs/initialization';
import {
  mkModule,
  mkComponent,
}                     from '../src/libs/builder';
import * as VARS      from './browser/variables';

fs.removeSync(VARS.TEMPORARY_FOLDER);

async.parallel([
  function (callback) {
    initialize(VARS.PROJECT_NAME, {
      dist: VARS.PROJECT_FOLDER,
    }, callback);
  },
  function (callback) {
    mkModule(VARS.PROJECT_NAME, {
      ignoreTrace : true,
      basePath    : '',
      distFolder  : VARS.MODULE_FOLDER,
    }, callback);
  },
  function (callback) {
    mkComponent(VARS.PROJECT_NAME, [], {
      ignoreTrace : true,
      basePath    : '',
      distFolder  : VARS.COMPONENT_FOLDER,
    }, callback);
  },
],
function (error) {
  if (error) {
    throw error;
  }

  let server = new Server({
    configFile: path.join(__dirname, './browser/karma.config'),
  },
  function (exitCode) {
    fs.removeSync(VARS.TEMPORARY_FOLDER);
    process.exit(exitCode);
  });

  server.start();
});
