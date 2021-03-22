# vue-resoure-larn
vue源码简版

## 安装依赖
- yarn install

## 开发环境
- 修改script/dev.js中的开发的包
- npm run dev

## 生产环境
- npm run build

## 新增package
- 在packages下面新增包，文件夹为包的名字
- 在包路径下面新增src/index.ts
- 在包路径下面npm init 初始化package.json
- 修改package.json为以下格式（以runtime-core为例）
```json
{
  "name": "@vue/runtime-core",
  "version": "1.0.0",
  "main": "index.js",
  "module": "dist/runtime-core.esm-bundler.js",
  "license": "MIT",
  "buildOptions": {
    "name": "VueRuntimeCore",
    "formats": [
      "esm-bundler"
    ]
  }
}
```

