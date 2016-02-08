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
