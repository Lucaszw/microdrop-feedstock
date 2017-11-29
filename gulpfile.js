const fs = require('fs');

const path = require('path');
const {promisify} = require('util');
const {spawn} = require('child_process');

const yaml = require('yamljs');
const gulp = require('gulp');

const microdrop = require('../../package.json');

const spawnAsync = (cmd) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {stdio: 'inherit', shell: true});
    child.on('exit', (d) => {
      resolve(undefined);
    });
  });
}

gulp.task('push:build:commit', async (d) => {
  await spawnAsync('git add package-lock.json && git add -p');
  await spawnAsync('git commit && git push origin master');
  await spawnAsync('cd .. && git add ./feedstock && git commit && git push origin master');
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
