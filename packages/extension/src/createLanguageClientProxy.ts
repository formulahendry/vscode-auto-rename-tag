import * as vscode from 'vscode';
import {
  Code2ProtocolConverter,
  LanguageClient,
  LanguageClientOptions,
  RequestType,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient';

type VslSendRequest = <P, R, E, RO>(
  type: RequestType<P, R, E, RO>,
  params: P
) => Thenable<R>;

export interface LanguageClientProxy {
  readonly code2ProtocolConverter: Code2ProtocolConverter;
  readonly sendRequest: VslSendRequest;
}

export const createLanguageClientProxy: (
  context: vscode.ExtensionContext,
  id: string,
  name: string,
  clientOptions: LanguageClientOptions
) => Promise<LanguageClientProxy> = async (
  context,
  id,
  name,
  clientOptions
) => {
  const serverModule = context.asAbsolutePath('../server/dist/serverMain.js');
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] }
    }
  };
  const outputChannel = vscode.window.createOutputChannel(name);
  clientOptions.outputChannel = {
    name: outputChannel.name,
    append() {},
    appendLine(value: string) {
      try {
        const message = JSON.parse(value);
        if (!message.isLSPMessage) {
          outputChannel.appendLine(value);
        }
      } catch (error) {
        if (typeof value !== 'object') {
          outputChannel.appendLine(value);
        }
      }
    },
    clear() {
      outputChannel.clear();
    },
    show() {
      outputChannel.show();
    },
    hide() {
      outputChannel.hide();
    },
    dispose() {
      outputChannel.dispose();
    }
  };

  const languageClient = new LanguageClient(
    id,
    name,
    serverOptions,
    clientOptions
  );

  languageClient.registerProposedFeatures();
  context.subscriptions.push(languageClient.start());
  await languageClient.onReady();
  const languageClientProxy: LanguageClientProxy = {
    code2ProtocolConverter: languageClient.code2ProtocolConverter,
    sendRequest: (type, params) => languageClient.sendRequest(type, params)
  };
  return languageClientProxy;
};
