
# Building and testing this repo

Two scripts are provided:

```bash
npm run build
npm run test
```

Tests are in the `spec` folder. They are written in Jasmine.

The build files are stored in `dist`. They are created with
Rollup. We build two files; one with ES6 exports, and one
with CommonJS. Both are otherwise Babelified down to ES5 code.
