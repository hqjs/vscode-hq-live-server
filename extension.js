const { ServerController } = require('./server-controller');
const { commands, workspace } = require('vscode');

exports.activate = context => {
  const serverController = new ServerController();

  context.subscriptions.push(commands
    .registerCommand('extension.hqServer.start', async () => {
      await workspace.saveAll();
      serverController.start();
    }));

  context.subscriptions.push(commands
    .registerCommand('extension.hqServer.stop', () => {
      serverController.stop();
    }));

  context.subscriptions.push(commands
    .registerCommand('extension.hqServer.build', async () => {
      await workspace.saveAll();
      serverController.start('build');
    }));

  context.subscriptions.push(commands
    .registerCommand('extension.hqServer.noop', () => {}));


  context.subscriptions.push(serverController);
};
