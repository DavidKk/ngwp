import path from 'path'

/**
 * check path is absolute or not.
 * if not, it will join cwd path in front of path.
 * @param  {String} file path
 * @param  {String} cwd  addition path
 * @return {String}
 */
export function absolute (file = './', cwd = process.cwd()) {
  if (path.isAbsolute(file)) {
    return file
  }

  return path.join(cwd, file)
}
