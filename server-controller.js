const { window, workspace, ProgressLocation } = require('vscode');
const { getProject } = require('./project-resolver');
const { openBrowser } = require('./open');
const path = require('path');
const { spawn } = require('child_process');
const { LiveShareController } = require('./live-share-controller');
const StatusbarUi = require('./statusbar-ui');

/* eslint-disable no-magic-numbers */

exports.ServerController = class ServerController {
  constructor() {
    this.servers = new Map;
    this.buildServers = new Map;
    const showOnStatusbar = workspace.getConfiguration('hqServer').get('showOnStatusbar');
    if (showOnStatusbar) {
      StatusbarUi.init();
      this.documentChangeSubscription = window.onDidChangeActiveTextEditor(() => {
        const { workspaceFolders } = workspace;
        if (!workspaceFolders) return StatusbarUi.disable();
        const activeProject = getProject(workspaceFolders);
        if (!activeProject) return StatusbarUi.disable();

        if (this.servers.has(activeProject.uri.fsPath)) {
          const { url } = this.servers.get(activeProject.uri.fsPath);
          StatusbarUi.stop(url);
        } else StatusbarUi.start();
        if (this.buildServers.has(activeProject.uri.fsPath)) {
          const { url } = this.buildServers.get(activeProject.uri.fsPath);
          StatusbarUi.buildProgress(url);
        } else StatusbarUi.build();
        return null;
      });
    }
  }

  async start(arg) {
    const { workspaceFolders } = workspace;
    if (!workspaceFolders) {
      return window.showErrorMessage('Open a folder or workspace... (File -> Open)');
    }

    if (workspaceFolders.length === 0) {
      return window.showErrorMessage('Add folder to the workspace... (File -> Add Folder to Workspace..)');
    }

    const activeProject = getProject(workspaceFolders);
    if (!activeProject) return StatusbarUi.disable();

    // if server is already running for this project, just open preview in a browser
    if (this.servers.has(activeProject.uri.fsPath)) {
      const { url } = this.servers.get(activeProject.uri.fsPath);
      await openBrowser(url);
      return null;
    }

    // otherwise start new server
    const defaultPort = workspace.getConfiguration('hqServer').get('defaultPort');
    const projectPath = activeProject.uri.fsPath;

    const nodeVersionProcess = spawn(
      'node',
      [ '--version' ],
      {
        cwd: projectPath,
        stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
      },
    );

    nodeVersionProcess.stdout.on('data', v => {
      const version = String(v);

      const [ major, minor ] = version
        .slice(1)
        .split('.')
        .map(x => Number(x));

      const jsModules = major < 14;

      const notSupported = major < 12 ||
        (major === 12 && minor < 10);
      if (notSupported) {
        return window.showErrorMessage(`System default node ${version} is not supported, please install node >= v12.10.0, make it default and restart VSCode: nvm i 12 && nvm alias default 12`);
      }

      const args = [ '--no-warnings' ];

      if (jsModules) args.push('--experimental-modules');

      const hq = spawn(
        'node',
        [ ...args, path.join(__dirname, './run.mjs'), projectPath, defaultPort, arg ],
        {
          cwd: projectPath,
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
        },
      );

      hq.stdout.on('data', data => console.log(String(data)));

      hq.stderr.on('data', data => console.error(String(data)));

      if (arg === 'build') {
        window.withProgress({
          cancellable: false,
          location: ProgressLocation.Notification,
          title: `Building ${activeProject.uri.fsPath}`,
        }, () => new Promise(resolve => {
          hq.on('exit', () => {
            StatusbarUi.build();
            this.buildServers.delete(activeProject.uri.fsPath);
            window.showInformationMessage(`Build completed ${activeProject.uri.fsPath}`);
            resolve();
          });
        }));
      }

      hq.on('message', url => {
        if (arg === 'build') {
          StatusbarUi.buildProgress();
          this.buildServers.set(activeProject.uri.fsPath, { hq, url });
        } else {
          const liveShareController = new LiveShareController;
          this.servers.set(activeProject.uri.fsPath, { hq, liveShareController, url });
          StatusbarUi.stop(url);
          liveShareController.share(activeProject.name, url);
          openBrowser(url);
        }
      });

      return null;
    });

    nodeVersionProcess.stderr.on('data', data => console.error(String(data)));

    return null;
  }

  stop() {
    const { workspaceFolders } = workspace;
    if (!workspaceFolders) {
      return window.showErrorMessage('Open a folder or workspace... (File -> Open)');
    }

    if (workspaceFolders.length === 0) {
      return window.showErrorMessage('Add folder to the workspace... (File -> Add Folder to Workspace..)');
    }

    const activeProject = getProject(workspaceFolders);
    if (!activeProject) return null;

    if (!this.servers.has(activeProject.uri.fsPath)) {
      return window.showErrorMessage(`Server is not running for project ${activeProject.name}`);
    }

    const { hq, liveShareController } = this.servers.get(activeProject.uri.fsPath);
    hq.kill();
    this.servers.delete(activeProject.uri.fsPath);
    StatusbarUi.start();
    liveShareController.stop();

    return null;
  }

  dispose() {
    for (const { hq } of this.servers.values()) hq.kill();
    for (const { hq } of this.buildServers.values()) hq.kill();
    StatusbarUi.dispose();
    if (this.documentChangeSubscription) this.documentChangeSubscription.dispose();
  }
};
