const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

const yaml = require('yamljs');
const gulp = require('gulp');

const microdrop = require('../../package.json');

gulp.task('update:meta.yaml', async (d) => {
  const file = path.resolve(__dirname, 'meta.yaml');

  // Load meta.yaml file
  const meta = yaml.load(file);
  meta.package.version = microdrop.version;

  // Write to file
  await promisify(fs.writeFile)(file, yaml.stringify(meta, 4));

});

gulp.task('build', () => {
  console.log("Building!!");
});
