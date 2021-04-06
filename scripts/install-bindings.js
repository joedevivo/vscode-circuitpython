#!/usr/bin/env node
const globby = require('globby');
var path=require('path');
var fs = require('fs');
let re = new RegExp('node_modules/(.*)/lib/binding/(.*)/(.*).node', '');
(async () => {
    var filez = await globby('../bindings-*/node_modules/**/lib/binding/*/*.node');
    filez.forEach(f => {
        console.log(`Found ${f}`);
        dest = f.replace(re, 'node_modules/$1/lib/binding/$2/$3.node');
        parent = path.dirname(dest);
        console.log(`Moving ${parent}`);
        console.log(`    to ${dest}`);
        fs.mkdirSync(parent, {recursive: true});
        fs.renameSync(f, dest); 
    });
})();
(async () => {
    var filez = await globby('node_modules/**/build/Release/*.node');
    filez.forEach(f => {
        dest = f.replace(re, 'node_modules/$1/lib/binding/$2/$3.node');
        parent = path.dirname(dest);;
        console.log(`Deleting ${parent}`);
        fs.rmdirSync(parent, {recursive: true});
    });
})();