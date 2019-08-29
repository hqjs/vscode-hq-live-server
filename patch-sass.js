const fs = require('fs-extra');

console.log('Removing node-sass');
fs.removeSync('node_modules/node-sass');

console.log('Patching postcss-node-sass');
const postCSSNodeSass = fs.readFileSync('node_modules/postcss-node-sass/index.js', { encoding: 'utf8' });
fs.writeFileSync(
  'node_modules/postcss-node-sass/index.js',
  postCSSNodeSass.replace('require(\'node-sass\')', 'require(\'sass\')'),
  { encoding: 'utf8' }
);
