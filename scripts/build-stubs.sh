#!/usr/bin/env bash

git clone --depth 1 --branch main https://github.com/adafruit/circuitpython.git
cd circuitpython
git submodule init
git submodule update extmod/ulab
pip3 install -r docs/requirements.txt
make stubs
mv circuitpython-stubs ../stubs
cd ..
pip3 install -r requirements.txt
python3 ./scripts/build_stubs.py
rm -rf stubs/board