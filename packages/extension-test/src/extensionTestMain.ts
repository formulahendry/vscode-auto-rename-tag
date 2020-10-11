import * as fs from 'fs-extra';
import * as path from 'path';
import { downloadAndUnzipVSCode, runTests } from 'vscode-test';

const root = path.join(__dirname, '../../../');
const vscodeVersion = '1.49.2';
const extensionDevelopmentPath = path.join(root, 'packages/extension');

interface Test {
  path: string;
}

const run = async (test: Test) => {
  try {
    const workspacePathSrc = path.join(
      __dirname.replace('dist', 'src'),
      `${test.path}/${test.path}-workspace`
    );
    const workspacePathDist = path.join(
      __dirname,
      `${test.path}/${test.path}-workspace-dist`
    );
    await fs.copy(workspacePathSrc, workspacePathDist);
    const extensionTestsPath = path.join(__dirname, test.path, 'suite');
    const vscodeExecutablePath = await downloadAndUnzipVSCode(vscodeVersion);

    const launchArgs: string[] = ['--disable-extensions', workspacePathDist];
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs,
      extensionTestsEnv: {
        extensionPath: extensionDevelopmentPath,
        NODE_ENV: 'test',
      },
    });
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    process.exit(1);
  }
};

run({ path: 'basic' });
