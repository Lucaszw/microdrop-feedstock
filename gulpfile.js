const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {spawn} = require('child_process');

const c = require('chalk');
const yaml = require('yamljs');
const gulp = require('gulp');

const microdrop = require('../../package.json');
const log = console.log;

const m1 = (m) => log(c.bold(c.blue(m)));
const m2 = (m) => log(c.bold(c.green(m)));

const spawnAsync = (cmd) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {stdio: 'inherit', shell: true});
    child.on('exit', (code) => {
      resolve(code);
    });
  });
}

gulp.task('push:build:commit', async (d) => {
  let code;

  m1('add changes to feedstock');
  code = await spawnAsync('git add package-lock.json && git add -p');
  m2(`code: ${code}`);

  m1('push changes to feedstock master branch');
  code = await spawnAsync('git commit && git push origin master');
  m2(`code: ${code}`);

  m1('push submodule changes to microdrop master branch');
  code = await spawnAsync('cd .. && git add ./feedstock && git commit -m "conda-build" && git push origin master');
  m2(`code: ${code}`);

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
