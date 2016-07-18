function pug_rethrow(n,e,r,t){if(!(n instanceof Error))throw n;if(!("undefined"==typeof window&&e||t))throw n.message+=" on line "+r,n;try{t=t||require("fs").readFileSync(e,"utf8")}catch(i){pug_rethrow(n,null,r)}var a=3,o=t.split("\n"),h=Math.max(r-a,0),s=Math.min(o.length,r+a),a=o.slice(h,s).map(function(n,e){var t=e+h+1;return(t==r?"  > ":"    ")+t+"| "+n}).join("\n");throw n.path=e,n.message=(e||"Pug")+":"+r+"\n"+a+"\n\n"+n.message,n}function templatedoctype(locals) {var pug_html = "", pug_mixins = {}, pug_interp;var pug_debug_filename, pug_debug_line;try {var pug_debug_sources = {"doctype.pug":".doctype\n  span.openBrace {\n    .fields\n  span.closeBrace },\n"};
;pug_debug_line = 1;pug_debug_filename = "doctype.pug";
pug_html = pug_html + "\u003Cdiv class=\"doctype\"\u003E";
;pug_debug_line = 2;pug_debug_filename = "doctype.pug";
pug_html = pug_html + "\u003Cspan class=\"openBrace\"\u003E";
;pug_debug_line = 2;pug_debug_filename = "doctype.pug";
pug_html = pug_html + "{";
;pug_debug_line = 3;pug_debug_filename = "doctype.pug";
pug_html = pug_html + "\u003Cdiv class=\"fields\"\u003E\u003C\u002Fdiv\u003E\u003C\u002Fspan\u003E";
;pug_debug_line = 4;pug_debug_filename = "doctype.pug";
pug_html = pug_html + "\u003Cspan class=\"closeBrace\"\u003E";
;pug_debug_line = 4;pug_debug_filename = "doctype.pug";
pug_html = pug_html + "},\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E";} catch (err) {pug_rethrow(err, pug_debug_filename, pug_debug_line, pug_debug_sources[pug_debug_filename]);};return pug_html;}