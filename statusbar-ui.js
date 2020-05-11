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

  static get statusbarBuild() {
    if (!StatusbarUi.statusBarBuildItem) {
      StatusbarUi.statusBarBuildItem = window
        .createStatusBarItem(StatusBarAlignment.Right, PRIORITY);

      const showOnStatusbar = workspace.getConfiguration('hqServer').get('showOnStatusbar');
      if (showOnStatusbar) this.statusbarBuild.show();
    }

    return StatusbarUi.statusBarBuildItem;
  }

  static init() {
    StatusbarUi.statusbar.text = '$(pulse) loading...';
    StatusbarUi.statusbar.tooltip = 'In case if it takes long time, try to close all browser window.';
    StatusbarUi.statusbar.command = undefined;
    StatusbarUi.statusbarBuild.text = '$(pulse) loading...';
    StatusbarUi.statusbarBuild.tooltip = 'In case if it takes long time, try to close all browser window.';
    StatusbarUi.statusbarBuild.command = undefined;
    setTimeout(() => {
      StatusbarUi.start();
      StatusbarUi.build();
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

  static build() {
    StatusbarUi.statusbarBuild.text = '$(package) Build';
    StatusbarUi.statusbarBuild.command = 'extension.hqServer.build';
    StatusbarUi.statusbarBuild.tooltip = 'Click to start hq build';
    StatusbarUi.statusbarBuild.color = 'lightgrey';
  }

  static buildProgress() {
    StatusbarUi.statusbarBuild.text = '$(clock) Building...';
    StatusbarUi.statusbarBuild.tooltip = 'Build in progress';
    StatusbarUi.statusbarBuild.command = 'extension.hqServer.noop';
    StatusbarUi.statusbarBuild.color = 'lightyellow';
  }

  static disable() {
    StatusbarUi.statusbar.text = '$(circle-slash) N/A';
    StatusbarUi.statusbar.command = 'extension.hqServer.noop';
    StatusbarUi.statusbar.tooltip = 'Can\'t determine project root';
    StatusbarUi.statusbar.color = 'lightgrey';
    StatusbarUi.statusbarBuild.text = '$(circle-slash) N/A';
    StatusbarUi.statusbarBuild.command = 'extension.hqServer.noop';
    StatusbarUi.statusbarBuild.tooltip = 'Can\'t determine project root';
    StatusbarUi.statusbarBuild.color = 'lightgrey';
  }

  static dispose() {
    StatusbarUi.statusbar.dispose();
    StatusbarUi.statusbarBuild.dispose();
  }
}

StatusbarUi.statusBarItem = null;
StatusbarUi.statusBarBuildItem = null;

module.exports = StatusbarUi;
