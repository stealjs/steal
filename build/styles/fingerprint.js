steal('steal/build').then(function() {
  var window = (function() {
    return this;
  }).call(null, 0);

  var modifyCss = function(css, str) {
    str = str || Date.now().toString();

    css = css.replace(/url\(['"]*([^"')]*)['"]*\)/g, function(match) {
      return match.substring(0, match.length - 1) + '?v=' + str + ')';
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