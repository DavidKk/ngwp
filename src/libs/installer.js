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

  let gitIgnore        = _.pick(OptionMerger, ['LOGGER_FOLDER_NAME', 'TEMPORARY_FOLDER_NAME', 'DEVELOP_FOLDER_NAME', 'DISTRICT_FOLDER_NAME', 'COVERAGE_FOLDER_NAME', 'VHOSTS_FOLDER_NAME']);
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
