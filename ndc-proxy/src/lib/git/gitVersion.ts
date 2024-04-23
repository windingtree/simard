import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import os from 'os';
const VERSION_FILENAME = '.version';

const setEnvFileVar = (key, value) => {

  // read file from hdd & split if from a linebreak to a array
  const ENV_VAR_LINES = readFileSync(VERSION_FILENAME, 'utf8').split(os.EOL);

  // find the env we want based on the key
  const lineIndex = ENV_VAR_LINES.findIndex((line) => {
      const lineKey = line.split('=', 2)[0];
      return key === lineKey;
  });

  if (lineIndex >= 0) {
    // if key was found, replace the key/value with the new value
    ENV_VAR_LINES.splice(lineIndex, 1, `${key}=${value}`);
  } else {
    // if key was not found append key/value pair to end
    ENV_VAR_LINES.push(`${key}=${value}`);
  }

  // write everything back to the file system
  writeFileSync(VERSION_FILENAME, ENV_VAR_LINES.join(os.EOL));

};

const updateEnvGitVersion = () => {
  const cmdGetCurrentBranch = 'git status';
  const cmdGetCurrentCommitHash = 'git rev-parse HEAD';

  // get current git branch
  const branch = execSync(cmdGetCurrentBranch).toString().split('\n')[0].trim();

  // get latest commit hash
  const commit = execSync(cmdGetCurrentCommitHash).toString().trim();

  // get current timestamp
  const timestamp = new Date().toISOString();

  console.log(`Updating Git version info in ${VERSION_FILENAME} file....`);

  setEnvFileVar('GIT_BRANCH_NAME', branch);
  setEnvFileVar('GIT_COMMIT_HASH', commit);
  setEnvFileVar('GIT_VERSION_TIMESTAMP', timestamp);

  console.log({branch, commit, timestamp});
  console.log('Done');

};

updateEnvGitVersion();
