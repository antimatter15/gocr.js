PATH="$PATH:~/Dropbox/Projects/naptha/libs/emscripten/"
cd gocr-*
emconfigure ./configure
emmake make
emcc -O2 -v src/*.o -o ../gocr.js --pre-js ../pre.js --post-js ../post.js
make clean