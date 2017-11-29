const fs = require('fs-extra');
const path = require('path');
const {promisify} = require('util');
const {spawn} = require('child_process');

const c = require('chalk');
const del = require('del');
const gulp = require('gulp');
const yaml = require('yamljs');

const microdrop = require('../../package.json');
const log = console.log;

const m1 = (...m) => log(c.bold(c.blue(...m)));
const m2 = (...m) => log(c.green(...m));
const newline = () => log('\n');
const title = (...m) => log('\n', ...m, '\n ');

const spawnAsync = (cmd, cwd) => {
  let options = {stdio: 'inherit', shell: true};
  if (cwd) options.cwd = cwd;

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, options);
    child.on('exit', (code) => {
      resolve(code);
    });
  });
}

const mvAsync = (src, dest) => {
  return new Promise((resolve, reject) => {
    mv(src, dest, {mkdirp: true}, function(err) {
      log(err);
      resolve(err);
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
});

gulp.task('build', async (d) => {

  const file = path.resolve(__dirname, 'meta.yaml');

  // Load meta.yaml file
  const meta = yaml.load(file);
  meta.package.version = microdrop.version;
  meta.package.name = microdrop.name;

  m1('updating meta.yaml file')
  await promisify(fs.writeFile)(file, yaml.stringify(meta, 4));
  m2(yaml.stringify(meta, 4));

  m1('running conda build .')
  await spawnAsync('conda build . --keep-old-work');
});

gulp.task('conda:build', async () => {
  const prefix = process.env.PREFIX;

  // Delete node_modules folder (in prep for moving)
  var src = path.resolve('../../..', 'work');
  await del(path.resolve(src, 'node_modules'));

  // Move src to prefix location
  var dest = path.resolve(prefix, 'microdrop-3.0');
  log('src:\n', src);
  newline();
  log('destination:\n', dest);
  newline();
  title('moving contents to destination');
  await promisify (fs.copy)(src, dest);

  // Re-Install dependencies
  title('installing dependencies');
  await spawnAsync('npm install', dest);
  title('installing plugins');
  await spawnAsync('gulp install:plugins:clean', dest);
  title('install finished');

  // Cleanup
  title('running npm dedupe');
  await spawnAsync('npm dedupe', dest);
});
