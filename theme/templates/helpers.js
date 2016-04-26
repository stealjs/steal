console.log('i heree');

module.exports = function(docMap, options, getCurrent){
  return {
    "makeAnchors" : function(text){
      console.log("i here");
      return (text||"").replace(/System/, "foobar");
    }
  }
};
