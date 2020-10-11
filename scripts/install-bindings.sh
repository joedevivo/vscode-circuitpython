#!/usr/bin/env bash

binding_root=$1
binding_workpath="./bindings"

echo "Looking for native bindings in ${binding_root}"
mkdir -p $binding_workpath
cp -r $binding_root/bindings-*/. $binding_workpath/.

echo "Deleting bindings built by npm install"
rm -rf ./node_modules/@serialport/bindings/build
rm -rf ./node_modules/drivelist/build



install() {
  # $1 is the node_module name, e.g. "@serialport/bindings"
  # $2 is the platorm specific path the binding should end up at
  IFS="/" read -ra MOD <<< "$1"
  dest_path="node_modules/$1/lib/binding/$2"
  file="${MOD[-1]}.node"
  dest="${dest_path}/${file}"
  echo "  Installing binding to ${dest}"
  mkdir -p $dest_path
  src="build/Release/${file}"
  echo "  Moving ${src} to "
  mv $src $dest
}

extract() {
  # $1 is the path under ./bindings of the tar file
  rm -rf build
  tar -xvzf $1
  IFS="-" read -ra TAR <<< "$1"
  package=$(echo "${TAR[0]}" | cut -c 10-)
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

cp -r $1/bindings* .

files=$(ls -AR bindings | awk '
/:$/&&f{s=$0;f=0}
/:$/&&!f{sub(/:$/,"");s=$0;f=1;next}
NF&&f{ print s"/"$0 }' | grep tar.gz)\

for f in $files; do
  echo "File: $f"
  extract $f
done