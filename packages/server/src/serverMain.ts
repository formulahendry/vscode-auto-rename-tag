import {
  createConnection,
  TextDocuments,
  TextDocumentSyncKind
} from "vscode-languageserver";
import { enableBetterErrorHandlingAndLogging } from "./errorHandlingAndLogging";
import { autoRenameTag, autoRenameTagRequestType } from "./autoRenameTag";
import { TextDocument } from "vscode-languageserver-textdocument";

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

enableBetterErrorHandlingAndLogging(connection);

connection.onInitialize(() => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental
  }
}));

connection.onInitialized(() => {
  console.log("Auto Rename Tag has been initialized.");
});

connection.onRequest(autoRenameTagRequestType, autoRenameTag(documents));

documents.listen(connection);
connection.listen();
