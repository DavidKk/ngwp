/**
 * 转化名字
 * @param  {String} name 名字
 * @return {Object}
 * @description
 * 将名字转化成各种格式名字包括 "-", "_", "camelName", "NAME", "name"
 * "-" 一般给 class 使用
 * "_" 一般给 filename
 * "camelName" 一般给JS使用
 */
export function convertName (name) {
  let camelcase = name.replace(/[- _]([\w])/g, ($all, $1) => {
    return $1.toUpperCase();
  })
  .replace(/^[A-Z]/, ($all) => {
    return $all.toLowerCase();
  });

  let underscore = camelcase.replace(/[A-Z]/g, ($all) => {
    return `_${$all.toLowerCase()}`;
  });

  let hyphen = camelcase.replace(/[A-Z]/g, ($all) => {
    return `-${$all.toLowerCase()}`;
  });

  let blank = camelcase.replace(/[A-Z]/g, ($all) => {
    return ` ${$all.toLowerCase()}`;
  })
  .replace(/^[a-z]/, ($all) => {
    return $all.toUpperCase();
  });

  let upCamelcase = camelcase.replace(/^[a-z]/, ($all) => {
    return $all.toUpperCase();
  });

  return {
    camelcase,
    upCamelcase,
    underscore,
    hyphen,
    blank,
  };
}

/**
 * 格式化大小单位
 * @param  {Number} bytes    大小
 * @param  {Number} decimals 保留小数点位数
 * @return {String}
 */
export function formatBytes (bytes, decimals) {
  if (0 === bytes) {
    return '0 Bytes';
  }

  let k     = 1000;
  let dm    = decimals + 1 || 3;
  let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i     = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 提示
 * @param  {Object} options 配置
 */
export function tracer (options = {}) {
  return function (message) {
    /* eslint no-console: off */
    true !== options.ignoreTrace && console.log(message);
  };
}
