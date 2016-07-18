function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;
function pug_rethrow(n,e,r,t){if(!(n instanceof Error))throw n;if(!("undefined"==typeof window&&e||t))throw n.message+=" on line "+r,n;try{t=t||require("fs").readFileSync(e,"utf8")}catch(i){pug_rethrow(n,null,r)}var a=3,o=t.split("\n"),h=Math.max(r-a,0),s=Math.min(o.length,r+a),a=o.slice(h,s).map(function(n,e){var t=e+h+1;return(t==r?"  > ":"    ")+t+"| "+n}).join("\n");throw n.path=e,n.message=(e||"Pug")+":"+r+"\n"+a+"\n\n"+n.message,n}function templatetypology(locals) {var pug_html = "", pug_mixins = {}, pug_interp;var pug_debug_filename, pug_debug_line;try {var pug_debug_sources = {"typology.pug":".typology\n  h3= typology\n  ul\n    each subset in subsets\n      li.subset= subset.Nom\n"};
;var locals_for_with = (locals || {});(function (subsets, typology) {;pug_debug_line = 1;pug_debug_filename = "typology.pug";
pug_html = pug_html + "\u003Cdiv class=\"typology\"\u003E";
;pug_debug_line = 2;pug_debug_filename = "typology.pug";
pug_html = pug_html + "\u003Ch3\u003E";
;pug_debug_line = 2;pug_debug_filename = "typology.pug";
pug_html = pug_html + (pug_escape(null == (pug_interp = typology) ? "" : pug_interp)) + "\u003C\u002Fh3\u003E";
;pug_debug_line = 3;pug_debug_filename = "typology.pug";
pug_html = pug_html + "\u003Cul\u003E";
;pug_debug_line = 4;pug_debug_filename = "typology.pug";
// iterate subsets
var pug_obj0 = subsets;
if ('number' == typeof pug_obj0.length) {

  for (var pug_index0 = 0, pug_length0 = pug_obj0.length; pug_index0 < pug_length0; pug_index0++) {
    var subset = pug_obj0[pug_index0];

;pug_debug_line = 5;pug_debug_filename = "typology.pug";
pug_html = pug_html + "\u003Cli class=\"subset\"\u003E";
;pug_debug_line = 5;pug_debug_filename = "typology.pug";
pug_html = pug_html + (pug_escape(null == (pug_interp = subset.Nom) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
  }

} else {
  var pug_length0 = 0;
  for (var pug_index0 in pug_obj0) {
    pug_length0++;
    var subset = pug_obj0[pug_index0];

;pug_debug_line = 5;pug_debug_filename = "typology.pug";
pug_html = pug_html + "\u003Cli class=\"subset\"\u003E";
;pug_debug_line = 5;pug_debug_filename = "typology.pug";
pug_html = pug_html + (pug_escape(null == (pug_interp = subset.Nom) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
  }

}

pug_html = pug_html + "\u003C\u002Ful\u003E\u003C\u002Fdiv\u003E";}.call(this,"subsets" in locals_for_with?locals_for_with.subsets:typeof subsets!=="undefined"?subsets:undefined,"typology" in locals_for_with?locals_for_with.typology:typeof typology!=="undefined"?typology:undefined));} catch (err) {pug_rethrow(err, pug_debug_filename, pug_debug_line, pug_debug_sources[pug_debug_filename]);};return pug_html;}