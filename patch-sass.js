const fs = require('fs-extra');

console.log('Patching @hqjs/hq');
const postCSSNodeSass = fs.readFileSync('node_modules/@hqjs/hq/compilers/css.mjs', { encoding: 'utf8' });
fs.writeFileSync(
  'node_modules/@hqjs/hq/compilers/css.mjs',
  postCSSNodeSass.replace('import(\'node-sass\')', 'import(\'sass\')'),
  { encoding: 'utf8' },
);

console.log('Patching @hqjs/hq package.json');
const packageJSON = fs.readJSONSync('node_modules/@hqjs/hq/package.json');
delete packageJSON.dependencies['node-sass'];
packageJSON.dependencies['sass'] = '*';
fs.writeFileSync('node_modules/@hqjs/hq/package.json', JSON.stringify(packageJSON), { encoding: 'utf8' });
