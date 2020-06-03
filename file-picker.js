const glob = require('glob');
const path = require('path');
const { Uri, window } = require('vscode');

class FileItem {
  constructor(base, uri) {
    this.label = path.basename(uri.fsPath);
    this.description = path.dirname(path.relative(base.fsPath, uri.fsPath));
  }
}

class MessageItem {
  constructor(base, message) {
    this.label = message.replace(/\r?\n/g, ' ');
    this.detail = base.fsPath;
    this.description = '';
  }
}

exports.pickFile = async activeProject => {
  const { fsPath: cwd } = activeProject.uri;
  const disposables = [];
  try {
    return await new Promise(resolve => {
      const input = window.createQuickPick();
      input.placeholder = 'Type to search for files';
      let searchTime;
      disposables.push(
        input.onDidChangeValue(value => {
          input.items = [];
          if (!value) {
            return;
          }
          searchTime = Date.now();
          const globTime = searchTime;

          glob(`**/*${value}*`, { cwd }, (err, matches) => {
            if (globTime !== searchTime) return;
            if (err) {
              input.items = input.items.concat([
                new MessageItem(Uri.file(cwd), err.message),
              ]);
            } else {
              input.items = input.items.concat(matches
                .slice(0, 50)
                .map(relative => new FileItem(Uri.file(cwd), Uri.file(path.join(cwd, relative)))));
            }
          });
        }),
        input.onDidChangeSelection(items => {
          console.log(items);
          const [ item ] = items;
          if (item instanceof FileItem) {
            resolve(path.resolve(item.description, item.label).slice(1));
            input.hide();
          }
        }),
        input.onDidHide(() => {
          resolve(undefined);
          input.dispose();
        }),
      );
      input.show();
    });
  } finally {
    for (const d of disposables) d.dispose();
  }
};
