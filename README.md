# Listings Project Listings Filter

This repo was originally cloned from [chrome-extension-webpack-boilerplate](https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate) and subsequently uses [Webpack](https://webpack.github.io/). Thus, in `develop` mode you can [automatically reload the browser on code changes](https://webpack.github.io/docs/webpack-dev-server.html#automatic-refresh), but not for content scripts.

## Installation

Checkout this repo and run `yarn install`.

## Developing

While working on this extension run `make develop` in a separate terminal window. This will allow hot-reloading of the popup and background modules; there is no option module for this extension. In your browser, add the `build` directory as an unpacked extension and off you go.

## Publish

When you're ready to push to your extension store, run `make build` locally and a zip file will appear in the `build` directory.

## Icon

The icon was edited using Gimp and is thus a Gimp file named `icon-128.xcf`. Edit that and then export PNGs to `./src/img` in `128px` and `34px` varieties.

## License

See the MIT license in `LICENSE.md`.
