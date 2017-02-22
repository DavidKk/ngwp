import _                 from 'lodash';
import fs                from 'fs-extra';
import path              from 'path';
import { copyAndRender } from './utils';
import OptionMerger      from './option_merger';

export function install (name, options, callback) {
  if (!_.isString(name)) {
    throw new Error('Name is not provided');
  }

  if (!_.isFunction(callback)) {
    throw new Error('Callback is not provided');
  }

  let tplFolder = path.join(OptionMerger.EXEC_PATH, './templates/project');
  let tarFolder = options.dist || OptionMerger.ROOT_PATH;

  fs.ensureDirSync(tarFolder);

  let gitIgnore        = _.pick(OptionMerger, ['LOG_DIR', 'TMP_DIR', 'DEV_DIR', 'DIST_DIR', 'COVERAGE_DIR']);
  let gitIngoreFolders = _.values(gitIgnore);

  /**
   * only set root directory
   */
  gitIngoreFolders = _.map(gitIngoreFolders, function (folder) {
      return '/' + folder;
  });

  copyAndRender(tplFolder, tarFolder, {
    name             : name,
    version          : options.version || '0.0.1',
    description      : options.description || `Project ${name}`,
    gitIngoreFolders : gitIngoreFolders,
  }, callback);
}
