removeRemoveSteal = function(text){
  return String(java.lang.String(text).replaceAll("(?s)\/\/@steal-remove-start(.*?)\/\/@steal-remove-end",""))
}
//@steal-remove-start
print( removeRemoveSteal(readFile("steal/compress/test/removecode.js")) )
//@steal-remove-end

