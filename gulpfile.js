const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {spawn} = require('child_process');

const c = require('chalk');
const yaml = require('yamljs');
const gulp = require('gulp');

const microdrop = require('../../package.json');
const log = console.log;

const spawnAsync = (cmd) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {stdio: 'inherit', shell: true});
    child.on('exit', (d) => {
      resolve(undefined);
    });
  });
}

gulp.task('push:build:commit', async (d) => {
  log(c.bold(c.blue('add changes to feedstock')));
  await spawnAsync('git add package-lock.json && git add -p');
  log(c.bold(c.blue('push changes to feedstock master branch')));
  await spawnAsync('git commit && git push origin master');
  log(c.bold(c.blue('push submodule changes to microdrop master branch')));
  await spawnAsync('cd .. && git add ./feedstock && git commit -m "conda-build" && git push origin master');
  console.log(process.cwd());
});

gulp.task('build', async (d) => {

  const file = path.resolve(__dirname, 'meta.yaml');

  // Load meta.yaml file
  const meta = yaml.load(file);
  meta.package.version = microdrop.version;

  // Write to file
  await promisify(fs.writeFile)(file, yaml.stringify(meta, 4));
});

gulp.task('conda:build', () => {
  spawn('npm i -g microdrop-3', {stdio: 'inherit', shell: true});
});
