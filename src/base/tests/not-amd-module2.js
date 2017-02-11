function makeDefinition(bar) {
  var bar = "foo";
  if( define(bar) === "foo"){
    return "is not a AMD module"
  }
}
function define(foo) {
  return foo
}