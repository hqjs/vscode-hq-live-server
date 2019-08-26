const { commands, window, workspace } = require('vscode');
const open = require('open');
const process = require('process');

const fixOpenBrowserLine = (url, browser = '') => {
  if (browser === 'chrome') {
    switch (process.platform) {
      case 'darwin': return 'google chrome';
      case 'linux': return 'google-chrome';
      case 'win32': return 'chrome';
      default: return 'chrome';
    }
  }
  if (browser.startsWith('microsoft-edge')) return `microsoft-edge:${url}`;
  return browser;
};

const tryBuiltinBrowser = async url => {
  const useBuiltinBrowser = workspace.getConfiguration('hqServer.browser').get('useBuiltinBrowser');
  if (useBuiltinBrowser) {
    try {
      await commands.executeCommand('browser-preview.openPreview', url);
    } catch (err) {
      console.log(`HQ Live Server: ${err}`);
      await window.showErrorMessage(`
        Server is started at ${url} but failed to open in Browser Preview.
        Make sure Browser Preview extension is installed?
      `);
    }
    return true;
  }
  return false;
};

const tryAdvancedBrowser = async url => {
  const browserCmdLine = workspace.getConfiguration('hqServer.browser').get('browserCmdLine');
  if (browserCmdLine) {
    const [ browser, ...params ] = browserCmdLine.split('--');
    const app = browser ?
      [ fixOpenBrowserLine(url, browser.trim()), ...params.map(p => `--${p}`) ] :
      [];
    await open(url, { app });
    return true;
  }
  return false;
};

const trySpecificBrowser = async url => {
  const preferredBrowser = workspace.getConfiguration('hqServer.browser').get('preferredBrowser');
  const attachCromeDebugger = workspace.getConfiguration('hqServer').get('attachChromeDebugger');
  const app = [];
  if (preferredBrowser) {
    const [ browser, ...details ] = preferredBrowser.split(':');
    app.push(fixOpenBrowserLine(url, browser));

    if (details[0] === 'PrivateMode') {
      if (browser === 'chrome' || browser === 'blisk') app.push('--incognito');
      else if (browser === 'firefox') app.push('--private-window');
    }

    if ((browser === 'chrome' || browser === 'blisk') && attachCromeDebugger) {
      app.push(...[
        '--new-window',
        '--no-default-browser-check',
        '--remote-debugging-port=9222',
        `--user-data-dir=${__dirname}`,
      ]);
    }
  }
  try {
    await open(url, { app });
  } catch (err) {
    console.log(`HQ Live Server: ${err}`);
    return window.showErrorMessage(`
      Server is started at ${url} but failed to open in Browser Preview.
      Make sure Browser Preview extension is installed?
    `);
  }
  return true;
};

exports.openBrowser = async url =>
  await tryBuiltinBrowser(url) ||
  await tryAdvancedBrowser(url) ||
  trySpecificBrowser(url);
