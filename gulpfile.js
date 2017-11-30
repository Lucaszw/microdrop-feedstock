const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawn} = require('child_process');

const chalk = require('chalk');
const gulp = require('gulp');
const yaml = require('yamljs');

const log = console.log;

const m1 = (...m) => log(chalk.bold(chalk.blue(...m)));
const m2 = (...m) => log(chalk.green(...m));
const title = (...m) => log('\n', ...m, '\n ');

const PACKAGE_NAME = 'microdrop-3.0';

gulp.task('build', async (d) => {
  /* Runs 'conda build .' after modifying meta.yaml */

  const file = path.resolve(__dirname, 'meta.yaml');

  // Load meta.yaml file
  m1('updating meta.yaml file');
  const meta = yaml.load(file);
  var {output} = await spawnAsync(`npm view ${PACKAGE_NAME} --json`, null, true);
  const microdrop = JSON.parse(output[0]);
  meta.package.version = microdrop.version;
  meta.package.name = microdrop.name;
  fs.writeFileSync(file, yaml.stringify(meta, 4));
  m2(yaml.stringify(meta, 4));

  m1('running conda build .');
  await spawnAsync('conda build .');

  m1('reverting meta.yaml file');
  meta.package.version = 'VERSION';
  meta.package.name = 'NAME';
  fs.writeFileSync(file, yaml.stringify(meta, 4));
  m2(yaml.stringify(meta, 4));

});

gulp.task('conda:build', async () => {
  /* Ran in conda build process */
  const prefix = process.env.PREFIX;

  if (os.platform() == 'win32') {
    title('installing buildtools (must be running as Administrator)');
    await spawnAsync(`npm install --global --production windows-build-tools`);
  }

  title('installing microdrop');
  await spawnAsync(`npm install -g ${PACKAGE_NAME}`);

  if (os.platform() == 'win32') {
    title('uninstalling buildtools (must be running as Administrator)');
    await spawnAsync(`npm uninstall --global windows-build-tools`);
  }

});

function spawnAsync(cmd, cwd, hideOutput) {

  let options = {shell: true};
  if (cwd) options.cwd = cwd;
  if (!hideOutput) options.stdio = 'inherit';

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, options);
    const output = [];
    if (hideOutput) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (d)=> {
        output.push(d);
      });
    }
    child.on('exit', (code) => {
      if (hideOutput)
        resolve({code, output});
      else
        resolve(code);
    });
  });
}
