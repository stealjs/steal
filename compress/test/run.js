// load('steal/compress/test/run.js')

/**
 * Tests compressing a very basic page and one that is using steal
 */

load('steal/test/helpers.js')
_S.clear();

load("steal/compress/compress.js")
new steal.Compress('steal/compress/test/basicpage.html','steal/compress/test');
_S.clear();

load("steal/compress/test/basicproduction.js")
_S.equals(BasicSource, 6, "Basic source not right number")

_S.clear();
_S.remove('steal/compress/test/basicproduction.js')


load("steal/compress/compress.js")
new steal.Compress('steal/compress/test/stealpage.html','steal/compress/test');
_S.clear();

_S.open('steal/compress/test/stealprodpage.html')
_S.equals(BasicSource, 7, "Basic source not right number")
_S.clear();

_S.remove('steal/compress/test/production.js')