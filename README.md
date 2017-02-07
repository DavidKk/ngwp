# 项目说明

## 本地环境安装

```
# 安装 NodeJS NPM
$ sudo apt-get install node npm

# 更新 NodeJS (Linux, OSX)
$ npm install -g n
$ n 6.2.2 (or latest)

# 更新 NPM
$ npm install -g npm

# 更新 NodeJS 6.2.2 或以上稳定版本
$ npm install -g n nrm
$ n use stable

# 使用淘宝源 或 cnpm 源
$ nrm use taobao

# 安装 node_modules
$ cd /path/to/project
$ npm install

# node-sass 需要编译, 所以耐心等待
```

#### Nginx 配置文件导入

```
# 生成 nginx 配置文件
$ ./bin/nginx
# 或者
$ npm run nginx

# 导入配置文件
$ echo "include /path/to/project/vhosts/nginx.conf;" >> /path/to/nginx/nginx.conf

# 重启nginx
# Linux
$ sudo service nginx restart
# OSX
$ sudo brew services restart nginx
```

## 代码编译与发布

```
# 开发环境编译
$ npm start

# 单元测试
$ npm test

# 发布代码
$ npm run release
```

## 模块与组件

```
# 生成路由
$ ./bin/module router module/componentA/componentB/...
```

生成新的模块时, 要重新生成 nginx 配置, 并再次重启 nginx 服务
