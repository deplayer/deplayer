# genar-radio

* [Online version](http://genar-radio.surge.sh/)

Media player thought to run entirelly in the web browser.

## Current features

* Progressive Web App
* Fulltext search support thanks to [elasticlunr](https://elasticlunr.com/).
* Support for Subsonic API.

## Keyboard hotkeys

* Play/Pause: `space`
* Next track: `Arrow right` or `j`
* Prev track: `Arrow left` or `k`
* Focus on search: `/`

## Installing

```bash
yarn
```

## Testing the app

```bash
yarn test
```

## Running dev environment

```bash
yarn start
```

## Libraries used

* axios
* react + redux
* react-router
* react-redux-i18n
* redux-saga
* sass-semantic-ui # This was a bad decision, to be removed in future releases
* bootstrap
* react-simple-share
* react-key-handler
