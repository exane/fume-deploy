[![npm version](https://badge.fury.io/js/fume-deploy.png)](https://badge.fury.io/js/fume-deploy)

# Fume-deploy

Fume-deploy is a simple deployment script for git in a very early stage.


## Motivation
I often have the problem that I'm working on a project and as soon as I finished it I host it on a server and move on to the next project.
One of the problems I always have when I come back after months: Which files are config files, build-files and which requires special treatment? If I wanted to update my old code base (and deploy + build it after) I often couldn't simply overwrite all files. I had to check each folder myself and tried to remember which file I shouldn't overwrite or have to manually edit later.

## How to use
Fume-deploy is heavily inspired by gulp. 

You need to add it in your project dependencies with 
```
npm install fume-deploy --save
```
Then you set up a fumefile.js file in your root folder.
The script starts with "node fumefile.js"
## Getting familiar with fume-deploy
If you want to see fume-deploy in action you can do the following steps:

- Fork [fume-deploy test-repo](https://github.com/exane/test-repo)
- Clone your fork
- Process the readme of the test-repo
- Open fumefile.js and change the deploy url to your fork
- Run in your commandline: node fumefile

You can now push commits to your repository and after running 'node fumefile' again you'll notice that without
any further action the app will be able to run. So you can deploy your updated app without thinking about to change your config files afterwards.



## Syntax
fume-deploy consists of a root (fume) and several branches: task, execute and deploy. While task is not mandatory (yet), execute statements should be inside a task though. The deploy method is a key function and should only get called once in the lifecycle.

![fume-deploy chaining diagram](http://i.imgur.com/rKUHpF5.png)

As an example of how a fumefile could look like:
```javascript
var fume = require("fume-deploy");

//the ignore function saves directories and files from being overwritten (from build process or if
//the newly cloned repository doesn't contain files, like api keys or other sensible data)
fume.keep("./config"); //whole directory
fume.keep("./SECRET_TEXT.txt"); //single file

//don't care files, they won't getting copied or moved
fume.ignore("./.htaccess");

//not necessary, since both are default values
fume.options.tempfolder = ".fume.tmp";
fume.options.backupfolder = ".fume";

fume.task(function() {
  //single shell command
  fume.execute("forever kill fumeserver");

  //deploy creates 2 directories by default: .fume and .fume.tmp
  //It clones a repository into .fume.tmp and makes a backup of the original root and saves it into .fume
  //All ignored files getting copied into .fume.tmp
  //After that, deploy changes the current working directory to .fume.tmp only for the following chained methods!
  //If you execute npm install after deploy it has his root in .fume.tmp
  //To reset the cwd you have to make a new fume branch like 'fume.execute()'
  fume.deploy("https://github.com/exane/test-repo")
    .execute("npm install")
    .execute("npm run gulp");

  // since it's a new fume branch, the root will be no longer .fume.tmp
  fume.execute("mkdir test")
    .execute("cat > text.txt");

  fume.execute("forever --uid fumeserver start server/server.js.");
}).start();
