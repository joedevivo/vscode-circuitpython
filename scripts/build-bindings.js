#!/usr/bin/env node
const nodeAbi = require('node-abi');
const globby = require('globby');
var abi = nodeAbi.getAbi('11.3.0', 'electron');
var dir = `node-v${abi}-${process.platform}-${process.arch}`;
console.log(`Building bindings for ${dir}`);
var fs = require('fs');
let re = new RegExp('node_modules/(.*)/build/Release/(.*).node', '');
var path=require('path');
(async () => {
    var filez = await globby('node_modules/**/build/Release/*.node');
    filez.forEach(f => {
        console.log(`Found ${f}`);
        dest = f.replace(re, `bindings/node_modules/$1/lib/binding/${dir}/$2.node`);
        parent = path.dirname(dest);
        console.log(`Moving ${parent}`);
        console.log(`    to ${dest}`);
        fs.mkdirSync(parent, {recursive: true});
        fs.renameSync(f, dest); 
    });
})();



