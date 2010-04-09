//steal/js steal/compress.js path/to/some/javascript/app
if (_args.length == 0 || _args.length > 2) {
  print("USAGE: compress <URL> [<OUTPUT_FOLDER>]");
  quit();
}
load("steal/compress/compress.js")
new steal.Compress(_args[0], _args[1]);