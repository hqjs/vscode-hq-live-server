const { getApi, Role } = require('vsls/vscode');

exports.LiveShareController = class {
  constructor() {
    this.sharedServer = null;
    this.name = '';
    this.port = 0;

    this.disposable = this.onSessionChange();
  }

  async share(name, url) {
    const port = Number(url.split(':')[2]);
    this.name = name;
    this.port = port;
    this.shareLiveServer();
  }

  async stop() {
    this.name = '';
    this.port = 0;
    if (this.sharedServer) {
      await this.sharedServer.dispose();
      this.sharedServer = null;
    }
  }

  async dispose() {
    await this.disposable;
    return this.stop();
  }

  async onSessionChange() {
    const api = await getApi();
    if (!api) return;
    api.onDidChangeSession(async ({ session }) => {
      if (session.role === Role.Host) {
        await this.shareLiveServer();
      }
    });
  }

  async shareLiveServer() {
    const api = await getApi();
    if (this.port && api && api.session && api.session.role === Role.Host) {
      this.sharedServer = await api.shareServer({
        browseUrl: `http://localhost:${this.port}`,
        displayName: `HQ | ${this.name}`,
        port: this.port,
      });
    }
  }
};
