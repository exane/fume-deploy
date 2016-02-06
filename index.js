//var argv = require("minimist")(process.argv.slice(2));
var exec = require("child_process").execSync;
var spawn = require("cross-spawn");
var buffer = require("buffer");
var fs = require("fs-extra");
var path = require("path");
var spawnArgs = require("spawn-args");

var fume = {
  path: "",
  root: process.cwd(),
  currentPath: process.cwd()
};
var tasks = fume._tasks = [];
var ignore = fume._ignore = [];

var log = function() {
  if(process.env.NODE_ENV !== 'test') return;
  console.log.apply(null, arguments);
}


fume.options = {
  "backupfolder": ".fume", //default?
  "tempfolder": ".fume.temp" //default
}

function parseCmd(cmd) {
  return {
    command: cmd.split(" ")[0],
    args: spawnArgs(cmd.substr(cmd.indexOf(" ") + 1))
  }
}


fume.execute = function(cmd, options) {
  if(this.stop) return this;
  options = options || {
      timeout: 60000
    };
  log("> %s", cmd);
  process.chdir(this.currentPath);

  var c = parseCmd(cmd);
  var useExec = c.args.some(function(e) {
    return e == "<" || e == ">"
  });
  var result;

  try {
    if(useExec) {
      result = exec(cmd);
    }
    else {
      result = spawn.sync(c.command, c.args, {stdio: 'inherit'});
    }
  }
  catch(e) {
    log("error > ", e);
    log("execute timeout or error occured!");
    process.chdir(this.root)
    return {
      execute: this.execute.bind(this),
      deploy: this.deploy.bind(this)
    }
  }
  if(useExec) {
    var buf = new Buffer(result);
    log("< %s", buf.toString());
  }
  process.chdir(this.root);
  return {
    execute: this.execute.bind(this),
    deploy: this.deploy.bind(this)
  }
}

fume.ignore = function(p) {
  ignore.push({
    absolute: path.resolve(p),
    relative: p
  });

  return {
    ignore: ignore
  };
}


var backup = function() {

  fs.removeSync(path.resolve(this.root, fume.options.backupfolder));

  fs.mkdirSync(fume.options.backupfolder);
  var content = fs.readdirSync("./");
  content.forEach(function(f) {
    //log(f);
    if(f === "fumefile.js" || f == fume.options.backupfolder || f == fume.options.tempfolder) return;
    fs.renameSync("./" + f, "./" + fume.options.backupfolder + "/" + f);
  })
}

var gitClone = function(git) {
  clearUp.call(this);
  fs.mkdirSync(fume.options.tempfolder);
  this.execute("git clone " + git + " ./" + fume.options.tempfolder);
}

var copyTempFilesToRoot = function() {
  process.chdir(this.root);

  fs.ensureDirSync(path.resolve(fume.options.tempfolder), function(err) {
    log(err)
  });
  fs.copySync(path.resolve(fume.options.tempfolder), this.root);

  process.chdir(this.currentPath);
}

var clearUp = function() {
  fs.removeSync(path.resolve(this.root, fume.options.tempfolder));
}

var handleIgnoreFiles = function() {
  ignore.forEach(function(p) {
    fs.copySync(p.absolute, path.resolve(fume.options.tempfolder, p.relative));
  })
}

/**
 * changes the current working directory to tempfolder.
 * (which is important for all following execute statements, since they'll all use the same new path from deploy)
 * If you want to reset the cwd you have to execute a new fume branch or change the cwd manually via execute.
 * @param git
 * @returns {Object}
 */
fume.deploy = function(git) {
  log("deploying %s", git);
  gitClone.call(this, git);
  handleIgnoreFiles.call(this);
  backup.call(this);

  log("cloning concluded");

  process.chdir(fume.options.tempfolder);
  var f = Object.create(this);

  f.currentPath = process.cwd();
  process.chdir("../");

  //return f;
  return {
    execute: f.execute.bind(f),
    deploy: f.deploy.bind(f)
  }
}

fume._done = function() {
  if(this.finished) return;
  this.finished = true;
  copyTempFilesToRoot.call(this);
  clearUp.call(this);
}

fume.task = function(task, _immediately) {
  if(typeof task != "function") throw Error();
  if(this.stop) return this;
  if(_immediately) {
    task();
    return this;
  }
  log("register task");
  tasks.push(task);

  return this;
}

fume.immediately = function(task) {
  return this.task(task, true);
}

fume.start = function() {
  log("starting");
  tasks.forEach(function(task) {
    task.call(this);
  })
  this._done();
}

module.exports = fume;

