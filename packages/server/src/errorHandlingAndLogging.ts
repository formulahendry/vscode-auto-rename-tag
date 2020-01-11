import { codeFrameColumns } from '@babel/code-frame';
import * as fs from 'fs';
import 'source-map-support/register';
import { Connection } from 'vscode-languageserver';

export const handleError: (error: Error) => void = error => {
  console.error(error.stack);
  const lines = error.stack?.split('\n') || [];
  let file = lines[1];
  if (file) {
    let match = file.match(/\((.*):(\d+):(\d+)\)$/);
    if (!match) {
      match = file.match(/at (.*):(\d+):(\d+)$/);
    }
    if (match) {
      const [_, path, line, column] = match;
      const rawLines = fs.readFileSync(path, 'utf-8');
      const location = {
        start: {
          line: parseInt(line),
          column: parseInt(column)
        }
      };

      const result = codeFrameColumns(rawLines, location);
      console.log('\n' + result + '\n');
    }
  }
  let relevantStack = (error as Error).stack
    ?.split('\n')
    .slice(1)
    .join('\n');
  if (relevantStack?.includes('at CallbackList.invoke')) {
    relevantStack = relevantStack.slice(
      0,
      relevantStack.indexOf('at CallbackList.invoke')
    );
  }
  console.log(relevantStack);
};

const useConnectionConsole: (
  connection: Connection,
  { trace }: { trace?: boolean }
) => (method: 'log' | 'info' | 'error') => (...args: any[]) => void = (
  connection,
  { trace = false } = {}
) => method => (...args) => {
  if (trace) {
    const stack = new Error().stack || '';
    let file = stack.split('\n')[2];
    file = file.slice(file.indexOf('at') + 'at'.length, -1);
    const match = file.match(/(.*):(\d+):(\d+)$/);
    if (match) {
      const [_, path, line, column] = match;
      connection.console[method]('at ' + path + ':' + line);
    }
  }
  const stringify: (arg: any) => string = arg => {
    if (arg && arg.toString) {
      if (arg.toString() === '[object Promise]') {
        return JSON.stringify(arg);
      }
      if (arg.toString() === '[object Object]') {
        return JSON.stringify(arg);
      }
      return arg;
    }
    return JSON.stringify(arg);
  };
  connection.console[method](args.map(stringify).join(''));
};

/**
 * Enables better stack traces for errors and logging.
 */
export const enableBetterErrorHandlingAndLogging: (
  connection: Connection
) => void = connection => {
  const connectionConsole = useConnectionConsole(connection, { trace: false });
  console.log = connectionConsole('log');
  console.info = connectionConsole('info');
  console.error = connectionConsole('error');
  process.on('uncaughtException', handleError);
  process.on('unhandledRejection', handleError);
};
