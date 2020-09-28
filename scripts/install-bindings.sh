#!/usr/bin/env bash

install() {
  IFS="/" read -ra MOD <<< "$1"
  mkdir -p node_modules/$1/lib/binding/$2
  mv build/Release/${MOD[-1]}.node node_modules/$1/lib/binding/$2/${MOD[-1]}.node
}

extract() {
  rm -rf build
  tar -xvzf bindings/$1
  IFS="-" read -ra TAR <<< "$1"
  package=${TAR[0]}
  echo "Package: $package"
  version=${TAR[1]}
  echo "Version: $version"
  abi=${TAR[3]}
  echo "ABI     : $abi"
  platform=${TAR[4]}
  echo "Platform: $platform"
  arch=${TAR[5]}
  IFS="." read -ra AR <<< "$arch"
  arch=${AR[0]}
  echo "Arch    : $arch"
  
  path="node-$abi-$platform-$arch"
  install $package $path 
}

extract_dir() {
  wd=$(pwd)
  cd $1
  for tarball in *.tar.gz; do
    extract $tarball
  done
}


files=$(ls -AR bindings* | awk '
/:$/&&f{s=$0;f=0}
/:$/&&!f{sub(/:$/,"");s=$0;f=1;next}
NF&&f{ print s"/"$0 }' | grep tar.gz |  cut -c 16-)\

for f in $files; do
  extract $f
done