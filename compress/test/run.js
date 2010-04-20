// load('steal/compress/test/run.js')

/**
 * Tests compressing a very basic page and one that is using steal
 */

load('steal/test/helpers.js')
_S.clear();

print("-- Compress basic page --");
load("steal/compress/compress.js")
new steal.Compress(['steal/compress/test/basicpage.html','steal/compress/test']);
_S.clear();

load("steal/compress/test/basicproduction.js")
_S.equals(BasicSource, 6, "Basic source not right number")

_S.clear();
_S.remove('steal/compress/test/basicproduction.js')

print("-- Compress page using steal --");
load("steal/compress/compress.js")
new steal.Compress(['steal/compress/test/stealpage.html','steal/compress/test']);
_S.clear();

_S.open('steal/compress/test/stealprodpage.html')
_S.equals(BasicSource, 7, "Basic source not right number")
_S.clear();

_S.remove('steal/compress/test/production.js')

print("-- Compress page with foreign characters --");
load("steal/compress/compress.js");
new steal.Compress(['steal/compress/test/foreign.html','steal/compress/test']);
_S.clear();

//load("steal/compress/test/foreignproduction.js")
//check that srcs are equal
f1 = readFile('foreign.js').replace(/\r/,"");
f2 = readFile('foreignproduction.js');
if(f1 !=  f2){
    print(f1+"\n---------------------------\n"+f2);
    throw "Foreign characters aren't right";
}

_S.clear();
_S.remove('steal/compress/test/foreignproduction.js')