const fs = require('fs-extra');
const path = require('path');
const {promisify} = require('util');
const {spawn} = require('child_process');

const c = require('chalk');
const del = require('del');
const dir = require('node-dir');
const gulp = require('gulp');
const yaml = require('yamljs');
const _ = require('lodash');

const log = console.log;

const m1 = (...m) => log(c.bold(c.blue(...m)));
const m2 = (...m) => log(c.green(...m));
const newline = () => log('\n');
const title = (...m) => log('\n', ...m, '\n ');

gulp.task('conda:build', async () => {
  /* Ran in conda build process */
  const prefix = process.env.PREFIX;
  const loc = path.resolve(prefix, 'share/microdrop-3');
  if (!fs.existsSync(loc)) fs.mkdirSync(loc);

  title('packing microdrop');
  await spawnAsync(`npm pack microdrop-3.0`, loc);

  title('removing node_modules folder from feedstock');
  await del(path.resolve('node_modules'));

  title('copying feedstock');
  const src = path.resolve('.');
  const dest = path.resolve(loc, 'feedstock');
  await promisify (fs.copy)(src, dest);
});

gulp.task('conda:post-link', async() => {
  log("POST LINK!");
  log(process.env);
  log(process.cwd());
  log(process.env.PREFIX);
  const prefix = process.env.PREFIX;
  const loc = path.resolve(prefix, 'share/microdrop-3')
  const contents = await dir.promiseFiles(loc);

  title('creating python2 environment');
  await spawnAsync('conda create --name python2_temp python=2.7');

  title('getting python2 environment location');
  var {output} = await spawnAsync('conda info --json', null, true);
  const info = JSON.parse(output[0]);
  var python2 = _.find(info.envs, (e) => _.includes(e, '/python2_temp'));
  python2 = path.resolve(python2, 'bin/python');
  log({info, python2});

  title('getting microdrop-3 package');
  let filename;
  for (const [i, file] of contents.entries()) {
    if (_.includes(file, 'microdrop-3.0') && _.includes(file, '.tgz')){
      filename = path.resolve(loc, file);
      break;
    }
  }
  log({filename});

  title('installing microdrop-3');
  await spawnAsync(`npm i ${filename} --python=${python2}`);

  title('removing python2 environment');
  await spawnAsync('conda remove --name python2_temp');

  title('post-link complete');
});

gulp.task('conda:run-test', async (d) => {
  title('Running tests...');
});

gulp.task('git:add:commit:push', async (d) => {
  /* Automate git add -p , git commit , and git push */
  let code;
  m1('add changes to feedstock');
  code = await spawnAsync('git add package-lock.json && git add -p');
  m2(`code: ${code}`);

  m1('push changes to feedstock master branch');
  code = await spawnAsync('git commit && git push origin master');
  m2(`code: ${code}`);
});

gulp.task('build', async (d) => {
  /* Runs 'conda build .' after modifying meta.yaml */

  const file = path.resolve(__dirname, 'meta.yaml');

  // Load meta.yaml file
  const meta = yaml.load(file);
  var {output} = await spawnAsync('npm view microdrop-3.0 --json', null, true);
  console.log({output});
  const microdrop = JSON.parse(output[0]);
  console.log({microdrop});
  meta.package.version = microdrop.version;
  meta.package.name = microdrop.name;

  m1('updating meta.yaml file')
  await promisify(fs.writeFile)(file, yaml.stringify(meta, 4));
  m2(yaml.stringify(meta, 4));

  m1('running conda build .')
  await spawnAsync('conda build . --keep-old-work');
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

function mvAsync(src, dest){
  return new Promise((resolve, reject) => {
    mv(src, dest, {mkdirp: true}, function(err) {
      log(err);
      resolve(err);
    });
  });
}
