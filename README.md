# Fume-deploy

Fume-deploy is a simple deployment script in a very early stage.


## Motivation
I often have the problem that I'm working on a project and as soon as I finished it I host it on a server and move on to the next project.
One of the problems I always have when I come back after months: Which files are config files, build-files and which requires special treatment? If I wanted to update my old code base (and deploy + build it after) I often couldn't simply overwrite all files. I had to check each folder myself and tried to remember which file I shouldn't overwrite or have to manually edit later.

## How to use
Fume-deploy is heavily inspired by gulp. Currently you setup a fumefile.js file and put it into your root folder.

The script gets execute via "node fumefile.js"



## Syntax
fume-deploy consists of a root (fume) and several branches: task, execute and deploy. While task is not mandatory (yet), execute statements should be inside a task though. The deploy method is a key function and should only get called once in the lifecycle.

![fume-deploy chaining diagram](http://i.imgur.com/rKUHpF5.png)

As an example of how a fumefile could look like:
```javascript
var fume = require("fume-deploy");

//the ignore function saves directories and files from being overwritten (from build process or if
//the newly cloned repository doesn't contain files, like api keys or other sensible data)
fume.ignore("./config"); //whole directory
fume.ignore("./SECRET_TEXT.txt"); //single file

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
