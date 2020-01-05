import * as fs from "fs-extra";
import * as path from "path";
import { downloadAndUnzipVSCode, runTests } from "vscode-test";

const root = path.join(__dirname, "../../../");
const vscodeVersion = "1.40.2";
const extensionDevelopmentPath = path.join(root, "packages/extension");

interface Test {
  path: string;
}

const run = async (test: Test) => {
  try {
    const workspacePathSrc = path.join(
      __dirname.replace("dist", "src"),
      `${test.path}/${test.path}-workspace`
    );
    const workspacePathDist = path.join(
      __dirname,
      `${test.path}/${test.path}-workspace-dist`
    );
    await fs.copy(workspacePathSrc, workspacePathDist);
    const extensionTestsPath = path.join(__dirname, test.path, "suite");
    const vscodeExecutablePath = await downloadAndUnzipVSCode(vscodeVersion);
    // const cliPath = resolveCliPathFromVSCodeExecutablePath(
    //   vscodeExecutablePath
    // );

    // const hasExtensionSettings = fs.existsSync(
    //   path.join(
    //     extensionRoot,
    //     `src/test/${test.path}/${testWorkspaceName}-workspace/.vscode/extensions.json`
    //   )
    // );
    // if (hasExtensionSettings) {
    //   const extensions = JSON.parse(
    //     fs.readFileSync(
    //       path.join(
    //         extensionRoot,
    //         `src/test/${test.path}/${testWorkspaceName}-workspace/.vscode/extensions.json`
    //       ),
    //       "utf-8"
    //     )
    //   ) as { recommendations?: string[] };
    //   const recommendations = extensions.recommendations || [];
    //   for (const recommendation of recommendations) {
    //     cp.spawnSync(cliPath, ["--install-extension", recommendation], {
    //       encoding: "utf-8",
    //       stdio: "inherit"
    //     });
    //   }
    // }

    const launchArgs: string[] = ["--disable-extensions", workspacePathDist];
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs,
      extensionTestsEnv: {
        extensionPath: extensionDevelopmentPath,
        NODE_ENV: "test"
      }
    });
  } catch (err) {
    console.error(err);
    console.error("Failed to run tests");
    process.exit(1);
  }
};

run({ path: "basic" });
