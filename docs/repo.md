
# Building and testing this repo

Two scripts are provided:

```bash
npm run build
npm run test
```

Tests are in the `spec` folder. They are written in Jasmine.
There is no daemon watching for changes; to re-run tests, you have to invoke the
test command again.

The build files are stored in `dist`. They are created with
Rollup. We build two files; one with ES6 exports, and one
with CommonJS. Both are otherwise Babelified down to ES5 code.
There are no dependencies.
