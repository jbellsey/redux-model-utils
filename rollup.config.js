import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/index.js',
  plugins: [
    babel({
      "babelrc": false,
      "presets": [
        ["env", {"modules": false}],
        "stage-0"
      ],
      "plugins": [
        "external-helpers"
      ]
    }),
    resolve({
      extensions: [ '.js', '.json' ],
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    }),
    commonjs()
  ],

  // peer deps should not be embedded
  // external: id => id === 'axios' || /lodash/.test(id),
  output: [{
    format: 'cjs',
    file: 'dist/rmu-cjs.js'
  }, {
    format: 'es',
    file: 'dist/rmu-es6.js'
  }]
};
