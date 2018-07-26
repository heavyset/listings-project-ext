Cloned from https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate

TODO replace all this junk below

# Chrome Extension Webpack Boilerplate

A basic foundation boilerplate for rich Chrome Extensions using [Webpack](https://webpack.github.io/) to help you write modular and modern Javascript code, load CSS easily and [automatic reload the browser on code changes](https://webpack.github.io/docs/webpack-dev-server.html#automatic-refresh).

## Structure
All your extension's development code must be placed in `src` folder, including the extension manifest.

The boilerplate is already prepared to have a popup, a options page and a background page. You can easily customize this.

Each page has its own [assets package defined](https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate/blob/master/webpack.config.js#L16-L20). So, to code on popup you must start your code on `src/js/popup.js`, for example.

You must use the [ES6 modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) to a better code organization. The boilerplate is already prepared to that and [here you have a little example](https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate/blob/master/src/js/popup.js#L2-L4).

## Webpack auto-reload and HRM
To make your workflow much more efficient this boilerplate uses the [webpack server](https://webpack.github.io/docs/webpack-dev-server.html) to development (started with `npm run server`) with auto reload feature that reloads the browser automatically every time that you save some file o your editor.

You can run the dev mode on other port if you want. Just specify the env var `port` like this:

```
$ PORT=6002 npm run start
```

## Content Scripts

## Packing
After the development of your extension run the command

```
$ NODE_ENV=production npm run build
```
Now, the content of `build` folder will be the extension ready to be submitted to the Chrome Web Store. Just take a look at the [official guide](https://developer.chrome.com/webstore/publish) to more infos about publishing.

## Icon

The icon was edited using Gimp and is thus a Gimp file named `icon-128.xcf`. Edit that and then export PNGs to `./src/img` in `128px` and `34px` varieties.
