const { window, workspace, StatusBarAlignment } = require('vscode');

const PRIORITY = 100;
const DELAY = 800;

class StatusbarUi {
  static get statusbar() {
    if (!StatusbarUi.statusBarItem) {
      StatusbarUi.statusBarItem = window
        .createStatusBarItem(StatusBarAlignment.Right, PRIORITY);

      const showOnStatusbar = workspace.getConfiguration('hqServer').get('showOnStatusbar');
      if (showOnStatusbar) this.statusbar.show();
    }

    return StatusbarUi.statusBarItem;
  }

  static init() {
    StatusbarUi.statusbar.text = '$(pulse) loading...';
    StatusbarUi.statusbar.tooltip = 'In case if it takes long time, try to close all browser window.';
    StatusbarUi.statusbar.command = undefined;
    setTimeout(() => {
      StatusbarUi.start();
    }, DELAY);
  }

  static start() {
    StatusbarUi.statusbar.text = '$(broadcast) Go Live';
    StatusbarUi.statusbar.command = 'extension.hqServer.start';
    StatusbarUi.statusbar.tooltip = 'Click to run hq live server';
    StatusbarUi.statusbar.color = 'lightgrey';
  }

  static stop(url) {
    StatusbarUi.statusbar.text = `$(zap) ${url}`;
    StatusbarUi.statusbar.command = 'extension.hqServer.stop';
    StatusbarUi.statusbar.tooltip = 'Click to stop hq live server';
    StatusbarUi.statusbar.color = 'lightgreen';
  }

  static disable() {
    StatusbarUi.statusbar.text = '$(circle-slash) N/A';
    StatusbarUi.statusbar.command = '';
    StatusbarUi.statusbar.tooltip = 'Can\'t determine project root';
    StatusbarUi.statusbar.color = 'lightgrey';
  }

  static dispose() {
    StatusbarUi.statusbar.dispose();
  }
}

StatusbarUi.statusBarItem = null;

module.exports = StatusbarUi;
