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

  context.subscriptions.push(serverController);
};
