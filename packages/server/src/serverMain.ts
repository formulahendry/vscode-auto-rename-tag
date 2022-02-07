import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  createConnection,
  TextDocuments,
  TextDocumentSyncKind
} from 'vscode-languageserver/node';
import { autoRenameTag, autoRenameTagRequestType } from './autoRenameTag';
import {
  enableBetterErrorHandlingAndLogging,
  handleError
} from './errorHandlingAndLogging';

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

enableBetterErrorHandlingAndLogging(connection);

connection.onInitialize(() => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental
  }
}));

connection.onInitialized(() => {
  console.log('Auto Rename Tag has been initialized.');
});

const handleRequest: <Params, Result>(
  fn: (params: Params) => Result
) => (params: Params) => Result = fn => params => {
  try {
    return fn(params);
  } catch (error) {
    handleError(error);
    throw error;
  }
};

connection.onRequest(
  autoRenameTagRequestType,
  handleRequest(autoRenameTag(documents))
);

documents.listen(connection);
connection.listen();
