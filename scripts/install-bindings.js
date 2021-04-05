#!/usr/bin/env node
const globby = require('globby');
var path=require('path');
var fs = require('fs');
/*
const nodeAbi = require('node-abi');
var abi = nodeAbi.getAbi('11.3.0', 'electron');
var dir = `node-${abi}-${process.platform}-${process.arch}`;
console.log(` Installing bindings for ${dir}`);
*/
let re = new RegExp('bindings/node_modules/(.*)/lib/binding/(.*)/(.*).node', '');
(async () => {
    var filez = await globby('bindings/node_modules/**/lib/binding/*/*.node');
    filez.forEach(f => {
        console.log(f);
        dest = f.replace(re, 'node_modules/$1/lib/binding/$2/$3.node');
        parent = path.dirname(dest);
        console.log(parent);
        fs.mkdirSync(parent, {recursive: true});
        fs.renameSync(f, dest);
        console.log(dest);  
    });
})();
