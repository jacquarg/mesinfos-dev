function pug_attr(t,e,n,r){if(e===!1||null==e||!e&&("class"===t||"style"===t))return"";if(e===!0)return" "+(r?t:t+'="'+t+'"');if("function"==typeof e.toISOString)e=e.toISOString();else if("string"!=typeof e&&(e=JSON.stringify(e),!n&&-1!==e.indexOf('"')))return" "+t+"='"+e.replace(/'/g,"&#39;")+"'";return n&&(e=pug_escape(e))," "+t+'="'+e+'"'}
function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&"object"==typeof s?pug_classes_object(s):s||""}
function pug_classes_array(r,a){for(var s,e="",u="",c=Array.isArray(a),g=0;g<r.length;g++)s=pug_classes(r[g]),s&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=" ");return e}
function pug_classes_object(r){var a="",n="";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=" ");return a}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;
function pug_rethrow(n,e,r,t){if(!(n instanceof Error))throw n;if(!("undefined"==typeof window&&e||t))throw n.message+=" on line "+r,n;try{t=t||require("fs").readFileSync(e,"utf8")}catch(i){pug_rethrow(n,null,r)}var a=3,o=t.split("\n"),h=Math.max(r-a,0),s=Math.min(o.length,r+a),a=o.slice(h,s).map(function(n,e){var t=e+h+1;return(t==r?"  > ":"    ")+t+"| "+n}).join("\n");throw n.path=e,n.message=(e||"Pug")+":"+r+"\n"+a+"\n\n"+n.message,n}function templatefield(locals) {var pug_html = "", pug_mixins = {}, pug_interp;var pug_debug_filename, pug_debug_line;try {var pug_debug_sources = {"field.pug":".field.compact(class=Nature)\n  span.name= Nom\n  |:&nbsp;\n  span.value= value\n  span.toggle ,\n\n  if Attention\n    span.caution \u002F\u002F&nbsp;\n     |= Attention\n\n  ul.details\n    li\n      b Description :&nbsp;\n      = Description\n    li\n      b Format :&nbsp;\n      = Format\n"};
;var locals_for_with = (locals || {});(function (Attention, Description, Format, Nature, Nom, value) {;pug_debug_line = 1;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cdiv" + (pug_attr("class", pug_classes(["field","compact",Nature], [false,false,true]), false, false)) + "\u003E";
;pug_debug_line = 2;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cspan class=\"name\"\u003E";
;pug_debug_line = 2;pug_debug_filename = "field.pug";
pug_html = pug_html + (pug_escape(null == (pug_interp = Nom) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
;pug_debug_line = 3;pug_debug_filename = "field.pug";
pug_html = pug_html + ":&nbsp;";
;pug_debug_line = 4;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cspan class=\"value\"\u003E";
;pug_debug_line = 4;pug_debug_filename = "field.pug";
pug_html = pug_html + (pug_escape(null == (pug_interp = value) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
;pug_debug_line = 5;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cspan class=\"toggle\"\u003E";
;pug_debug_line = 5;pug_debug_filename = "field.pug";
pug_html = pug_html + ",\u003C\u002Fspan\u003E";
;pug_debug_line = 7;pug_debug_filename = "field.pug";
if (Attention) {
;pug_debug_line = 8;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cspan class=\"caution\"\u003E";
;pug_debug_line = 8;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u002F\u002F&nbsp;";
;pug_debug_line = 9;pug_debug_filename = "field.pug";
pug_html = pug_html + "= Attention\u003C\u002Fspan\u003E";
}
;pug_debug_line = 11;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cul class=\"details\"\u003E";
;pug_debug_line = 12;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cli\u003E";
;pug_debug_line = 13;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cb\u003E";
;pug_debug_line = 13;pug_debug_filename = "field.pug";
pug_html = pug_html + "Description :&nbsp;\u003C\u002Fb\u003E";
;pug_debug_line = 14;pug_debug_filename = "field.pug";
pug_html = pug_html + (pug_escape(null == (pug_interp = Description) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
;pug_debug_line = 15;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cli\u003E";
;pug_debug_line = 16;pug_debug_filename = "field.pug";
pug_html = pug_html + "\u003Cb\u003E";
;pug_debug_line = 16;pug_debug_filename = "field.pug";
pug_html = pug_html + "Format :&nbsp;\u003C\u002Fb\u003E";
;pug_debug_line = 17;pug_debug_filename = "field.pug";
pug_html = pug_html + (pug_escape(null == (pug_interp = Format) ? "" : pug_interp)) + "\u003C\u002Fli\u003E\u003C\u002Ful\u003E\u003C\u002Fdiv\u003E";}.call(this,"Attention" in locals_for_with?locals_for_with.Attention:typeof Attention!=="undefined"?Attention:undefined,"Description" in locals_for_with?locals_for_with.Description:typeof Description!=="undefined"?Description:undefined,"Format" in locals_for_with?locals_for_with.Format:typeof Format!=="undefined"?Format:undefined,"Nature" in locals_for_with?locals_for_with.Nature:typeof Nature!=="undefined"?Nature:undefined,"Nom" in locals_for_with?locals_for_with.Nom:typeof Nom!=="undefined"?Nom:undefined,"value" in locals_for_with?locals_for_with.value:typeof value!=="undefined"?value:undefined));} catch (err) {pug_rethrow(err, pug_debug_filename, pug_debug_line, pug_debug_sources[pug_debug_filename]);};return pug_html;}