#!/usr/bin/env node

const util = require('util');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const yargs = require("yargs");

const options = yargs
.usage("Usage: -n <app-name>")
.options("n",{alias:"new", describe:"application name", type:"string", demandOption: true})
.argv;

const exec = util.promisify(require('child_process').exec);

async function runCmd(command){
    try{
        const { stdout, stderr } = await exec(command);
        console.log(stdout);
        console.log(stderr);
    }catch{
        (error) => {
            console.log(error);
        };
    }
}

const ownPath = process.cwd();
const folderName = options.new;
const appPath = path.join(ownPath, folderName);

//const data = fs.readFileSync('./app.js',{encoding:'utf8', flag:'r'});

//console.log(fs.readdirSync(__dirname));
async function createOrRemoveFolder(path, remove=false){
    try{
        if(remove){
            await fs.promises.rm(path,{ recursive: true, force: true });
        }else{
            fs.mkdirSync(path);
        }
    }catch(err){
        if(err.code === 'EEXIST'){
            console.log('Directory already exists. Please choose another name for the project.');
        } else {
            console.log(err);
        }
        console.log(err);
        process.exit(1);
    }
}


async function setup(){
    try{
        console.log('Creating Express Backend');
        await runCmd(`express ${folderName}`);
        console.log('folder created success fully');
        await createOrRemoveFolder(path.join(appPath,'views'),true);
        console.log("removed default view");
        await createOrRemoveFolder(path.join(appPath,'controllers'));
        console.log("added controllers");
        await createOrRemoveFolder(path.join(appPath,'models'));
        console.log("added models");
        //await createOrRemoveFolder(path.join(appPath,'utils'));
        fs.copyFileSync(path.join(appPath, 'bin/www'), path.join(appPath, 'server.js'));
        console.log("created server.js file");
        
        
        fs.copyFileSync(path.join(__dirname,'app.js'),path.join(appPath, 'app.js'));
        console.log("updated app.js");
        fs.copyFileSync(path.join(__dirname,'route-index.js'),path.join(appPath,'routes','index.js'));
        console.log("updated routes/index.js");
        await createOrRemoveFolder(path.join(appPath,'routes','users.js'),true);
        console.log("Remove the users.js file");
        await createOrRemoveFolder(path.join(appPath,'bin'),true);
        
        fs.writeFileSync(path.join(appPath,'.env'),
        `NODE_ENV=development
        PORT=5000`);

        fs.writeFileSync(path.join(appPath,'server.js'),
        "const dotenv = require('dotenv').config({ path: './.env' });"
        + fs.readFileSync(path.join(appPath,"server.js")));

        console.log("updated server.js file");
        console.log("Finished backend server");
        process.chdir(appPath);
        await runCmd("npm install");
        console.log("creating FrontEnd");
        await runCmd(`ng new ${folderName} --defaults`);
        console.log("created Angular app");

        process.chdir(appPath+"/"+folderName);
        await runCmd(`ng config projects.${folderName}.architect.build.options.outputPath "../public/"`);
        console.log("completed setup of outputPath");

        await runCmd(`ng config projects.${folderName}.architect.serve.options.proxyConfig "src/proxy.conf.json"`);
        console.log("added proxy config");

        fs.copyFileSync(path.join(__dirname,"proxy.conf.json"),path.join(appPath,folderName,"src/proxy.conf.json"));
        await runCmd(`ng build --prod`);
        console.log("completed FrontEnd");
    }catch(error){
        console.log(error);
    }
}

setup();
