#!/usr/bin/env bash

# Electon Versions
declare -a electron=( "11.3.0" )

working=$(pwd)
mkdir -p $working/bindings
cd node_modules/$1
#for e in $electron; do
for e in "${electron[@]}"; do
  $working/node_modules/.bin/prebuild -t $e -r electron
  #echo $e
done

cp -r prebuilds/* $working/bindings/.
cd $working