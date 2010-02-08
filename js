#!/bin/sh
# This script checks for arguments, if they don't exist it opens the Rhino dialog
# if arguments do exist, it loads the script in the first argument and passes the other arguments to the script
# ie: ./js jmvc/script/controller Todo

if [ $# -eq 0 ]
then
  java -cp jmvc/rhino/js.jar:jmvc/rhino/selenium-java-client-driver.jar org.mozilla.javascript.tools.shell.Main
  exit 127
fi
if [ $1 = "-selenium" ]
then
  java -jar jmvc/rhino/selenium-server.jar
  exit 127
fi

if [ $1 = "-h" -o $1 = "-?" -o $1 = "--help" ]
then
echo Load a command line Rhino JavaScript environment or run JavaScript script files in Rhino.
echo Available commands:
echo -e "./js\t\t\t\tOpens a command line JavaScript environment"
echo -e "./js -d\t\t\t\tOpens the Rhino debugger"
echo -e "./js [FILE]\t\t\tRuns FILE in the Rhino environment"
echo -e ""
echo  -e "JavaScriptMVC script usage:"
echo  -e "./js jmvc/generate/app [NAME]\t\tCreates a new JavaScriptMVC application"
echo  -e "./js jmvc/generate/page [APP] [PAGE]\tGenerates a page for the application"
echo  -e "./js jmvc/generate/controller [NAME]\tGenerates a Controller file"
echo  -e "./js jmvc/generate/model [TYPE] [NAME]\tGenerates a Model file"
echo  -e "./js apps/[NAME]/compress.js\t\tCompress your application and generate documentation"
  exit 127
fi


if [ $1 = "-d" ]
then
        java -classpath jmvc/rhino/js.jar:jmvc/rhino/selenium-java-client-driver.jar org.mozilla.javascript.tools.debugger.Main
        exit 127
fi

ARGS=[
for arg
do
  if [ $arg != $1 ]
  then
    ARGS=$ARGS"'$arg'",
  fi
done
ARGS=$ARGS]
java -cp jmvc/rhino/js.jar:jmvc/rhino/selenium-java-client-driver.jar org.mozilla.javascript.tools.shell.Main -e _args=$ARGS -e 'load('"'"$1"'"')'
