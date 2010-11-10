steal(function( steal ) {
    /**
    * cssmin.js
    * Author: Stoyan Stefanov - http://phpied.com/
    * This is a JavaScript port of the CSS minification tool
    * distributed with YUICompressor, itself a port
    * of the cssmin utility by Isaac Schlueter - http://foohack.com/
    * Permission is hereby granted to use the JavaScript version under the same
    * conditions as the YUICompressor (original YUICompressor note below).
     * YUI Compressor
    * Author: Julien Lecomte - http://www.julienlecomte.net/
    * Copyright (c) 2009 Yahoo! Inc. All rights reserved.
    * The copyrights embodied in the content of this file are licensed
    * by Yahoo! Inc. under the BSD (revised) open source license.
    */
    var YAHOO=YAHOO||{};YAHOO.compressor=YAHOO.compressor||{}; YAHOO.compressor.cssmin=function(a,m){var e=0,f=0,c=0,l=0,g=[],k=[],j="";c=a.length;for(f="";(e=a.indexOf("/*",e))>=0;){f=a.indexOf("*/",e+2);if(f<0)f=c;j=a.slice(e+2,f);k.push(j);a=a.slice(0,e+2)+"___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_"+(k.length-1)+"___"+a.slice(f);e+=2}a=a.replace(/("([^\\"]|\\.|\\)*")|('([^\\']|\\.|\\)*')/g,function(b){var h,d,i=b.substring(0,1);b=b.slice(1,-1);if(b.indexOf("___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_")>=0){h=0;for(d=k.length;h<d;h+=1)b=b.replace("___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_"+ h+"___",k[h])}b=b.replace(/progid:DXImageTransform\.Microsoft\.Alpha\(Opacity=/gi,"alpha(opacity=");g.push(b);return i+"___YUICSSMIN_PRESERVED_TOKEN_"+(g.length-1)+"___"+i});c=0;for(l=k.length;c<l;c+=1){j=k[c];f="___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_"+c+"___";if(j.charAt(0)==="!"){g.push(j);a=a.replace(f,"___YUICSSMIN_PRESERVED_TOKEN_"+(g.length-1)+"___")}else if(j.charAt(j.length-1)==="\\"){g.push("\\");a=a.replace(f,"___YUICSSMIN_PRESERVED_TOKEN_"+(g.length-1)+"___");c+=1;g.push("");a=a.replace("___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_"+ c+"___","___YUICSSMIN_PRESERVED_TOKEN_"+(g.length-1)+"___")}else{if(j.length===0){e=a.indexOf(f);if(e>2)if(a.charAt(e-3)===">"){g.push("");a=a.replace(f,"___YUICSSMIN_PRESERVED_TOKEN_"+(g.length-1)+"___")}}a=a.replace("/*"+f+"*/","")}}a=a.replace(/\s+/g," ");a=a.replace(/(^|\})(([^\{:])+:)+([^\{]*\{)/g,function(b){return b.replace(":","___YUICSSMIN_PSEUDOCLASSCOLON___")});a=a.replace(/\s+([!{};:>+\(\)\],])/g,"$1");a=a.replace(/___YUICSSMIN_PSEUDOCLASSCOLON___/g,":");a=a.replace(/:first-(line|letter)(\{|,)/g, ":first-$1 $2");a=a.replace(/\*\/ /g,"*/");a=a.replace(/^(.*)(@charset "[^"]*";)/gi,"$2$1");a=a.replace(/^(\s*@charset [^;]+;\s*)+/gi,"$1");a=a.replace(/\band\(/gi,"and (");a=a.replace(/([!{}:;>+\(\[,])\s+/g,"$1");a=a.replace(/;+\}/g,"}");a=a.replace(/([\s:])(0)(px|em|%|in|cm|mm|pc|pt|ex)/gi,"$1$2");a=a.replace(/:0 0 0 0(;|\})/g,":0$1");a=a.replace(/:0 0 0(;|\})/g,":0$1");a=a.replace(/:0 0(;|\})/g,":0$1");a=a.replace(/(background-position|transform-origin|webkit-transform-origin|moz-transform-origin|o-transform-origin|ms-transform-origin):0(;|\})/gi, function(b,h,d){return h.toLowerCase()+":0 0"+d});a=a.replace(/(:|\s)0+\.(\d+)/g,"$1.$2");a=a.replace(/rgb\s*\(\s*([0-9,\s]+)\s*\)/gi,function(b,h){var d,i=h.split(",");for(d=0;d<i.length;d+=1){i[d]=parseInt(i[d],10).toString(16);if(i[d].length===1)i[d]="0"+i[d]}return"#"+i.join("")});a=a.replace(/([^"'=\s])(\s*)#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])/gi,function(){var b=arguments;return b[3].toLowerCase()===b[4].toLowerCase()&&b[5].toLowerCase()===b[6].toLowerCase()&&b[7].toLowerCase()=== b[8].toLowerCase()?(b[1]+b[2]+"#"+b[3]+b[5]+b[7]).toLowerCase():b[0].toLowerCase()});a=a.replace(/(border|border-top|border-right|border-bottom|border-right|outline|background):none(;|\})/gi,function(b,h,d){return h.toLowerCase()+":0"+d});a=a.replace(/progid:DXImageTransform\.Microsoft\.Alpha\(Opacity=/gi,"alpha(opacity=");a=a.replace(/[^\};\{\/]+\{\}/g,"");if(m>=0)for(c=e=0;c<a.length;){c+=1;if(a[c-1]==="}"&&c-e>m){a=a.slice(0,c)+"\n"+a.slice(c);e=c}}a=a.replace(/;;+/g,";");c=0;for(l=g.length;c< l;c+=1)a=a.replace("___YUICSSMIN_PRESERVED_TOKEN_"+c+"___",g[c]);return a=a.replace(/^\s+|\s+$/g,"")};

    steal.cssMin = function( css ) {
        //remove comments & minify
        return YAHOO.compressor.cssmin(css);
    }
});