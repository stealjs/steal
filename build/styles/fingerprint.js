steal('steal/build').then(function() {
  var window = (function() {
    return this;
  }).call(null, 0);

  var modifyCss = function(css, v) {
    v = v || Date.now().toString();

    css = css.replace(/url\((['"]*)([^"'\)]*)['"]*\)/g, function(str, p1, p2) {
      return 'url(' + p1 + p2 + '?v=' + v + p1 + ')';
    });

    return css;
  },

  fingerprint = function(path, str) {
    var text = modifyCss( readFile(path), str );
    steal.File(path).save(text);
  },

  Cengage = Cengage || {};

  Cengage.fingerprint = fingerprint;
  window.Cengage = Cengage;

});