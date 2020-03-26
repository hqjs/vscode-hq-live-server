const { window, workspace } = require('vscode');
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
        return null;
      });
    }
  }

  async start() {
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

      const jsonModules = major > 12 ||
        (major === 12 && minor >= 13);

      const args = [
        '--no-warnings',
        '--experimental-modules',
      ];

      if (jsonModules) args.push('--experimental-json-modules');

      const hq = spawn(
        'node',
        [ ...args, path.join(__dirname, './run.mjs'), projectPath, defaultPort ],
        {
          cwd: projectPath,
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
        },
      );

      hq.stdout.on('data', data => console.log(String(data)));

      hq.stderr.on('data', data => console.error(String(data)));

      hq.on('message', url => {
        const liveShareController = new LiveShareController;
        this.servers.set(activeProject.uri.fsPath, { hq, liveShareController, url });
        StatusbarUi.stop(url);
        liveShareController.share(activeProject.name, url);
        openBrowser(url);
      });
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
    StatusbarUi.dispose();
    if (this.documentChangeSubscription) this.documentChangeSubscription.dispose();
  }
};
