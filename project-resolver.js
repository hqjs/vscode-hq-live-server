const { window } = require('vscode');
const path = require('path');

exports.getProject = workspaceFolders => {
  // TODO: get file name from images and other non text documents
  const activeFileName = window.activeTextEditor && window.activeTextEditor.document.fileName;

  if (activeFileName) {
    const activeProject = workspaceFolders
      .find(project => activeFileName.startsWith(`${project.uri.fsPath}${path.sep}`));
    if (!activeProject) {
      window.showErrorMessage(`Could not start HQ Live Server:
        Selected file ${activeFileName} does not belong to any project`);
      return null;
    }
    return activeProject;
  }

  return null;
};
