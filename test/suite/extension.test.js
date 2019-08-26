//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');

// Defines a Mocha test suite to group tests of similar kind together
suite('Extension Tests', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('hqjs.hq-live-server'));
  });

  test('should activate', function() {
    this.timeout(1 * 60 * 1000);
    return vscode.extensions.getExtension('hqjs.hq-live-server').activate()
      .then(() => {
        assert.ok(true);
      });
  });

  test('should register all live server commands', () => vscode.commands.getCommands(true).then(commands => {
    const COMMANDS = [
      'extension.hqServer.start',
      'extension.hqServer.stop',
    ];
    const foundCommands = commands.filter(value => COMMANDS.includes(value) || value.startsWith('extension.hqServer.'));
    assert.equal(foundCommands.length, COMMANDS.length);
  }));
});
