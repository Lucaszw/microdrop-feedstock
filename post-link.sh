source activate
npm --prefix $(npm root -g)/microdrop-3.0/packages/feedstock install
gulp --cwd $(npm root -g)/microdrop-3.0/packages/feedstock conda:post-link
