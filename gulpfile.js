const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {spawn} = require('child_process');

const c = require('chalk');
const mv = require('mv');
const gulp = require('gulp');
const yaml = require('yamljs');

const microdrop = require('../../package.json');
const log = console.log;

const m1 = (...m) => log(c.bold(c.blue(...m)));
const m2 = (...m) => log(c.green(...m));

const spawnAsync = (cmd) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {stdio: 'inherit', shell: true});
    child.on('exit', (code) => {
      resolve(code);
    });
  });
}

const mvAsync = (src, dest) => {
  return new Promise((resolve, reject) => {
    mv(src, dest, {mkdirp: true}, function(err) {
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
  await spawnAsync('conda build .');
});

gulp.task('conda:build', async () => {
  m1('recursively installing packages');
  await spawnAsync('gulp install:all');

  const prefix = process.env.PREFIX;
  m2('environment prefix:', prefix);

  // wrap working directory into a node_modules folder
  var src = path.resolve('.', '*');
  var dest = path.resolve(prefix, 'microdrop-3.0');
  m1('moving', src, 'to', dest);
  await mvAsync(src, dest);

  // await mvAsync(path.resolve('..', 'microdrop-3.0'), path.resolve('.', 'node_modules'));

  // ./node_modules/microdrop
});
