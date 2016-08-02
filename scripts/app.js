var metadata = null;


function init() {
    // Fetch data :
    Promise.resolve($.getJSON('data/list_data.json'))
        .then(function(data) {
      metadata = data["export"];
      var subsets = metadata.filter(function(field) {
        return field.Nature === 'Subset';
      });

      displaySubsetsPanel(subsets);
      // TODO return initSubsetsViews(subsets);
      return Promise.resolve();
    }).then(function() {
        setListeners();
    });
}

function initSubsetsViews(subsets) {
    var initPromises = subsets.map(function(subset) {
        return updateView(subset.docType,
            convertToSlug(subset.Nom), testToMapFunction(subset.Format));
    });

    return Promise.all(initPromises);
}

function setListeners() {
    $('#inputsend').click(doThings);
}

function queryView(docType, name) {
    return cozysdk.run(docType, name,
        { include_docs: true, limit: 10 });
}

// Delete views ?

function updateView(docType, name, mapFunction) {
    return cozysdk.defineView(docType, name, mapFunction)
        .then(function() {
             return cozysdk.run(docType, name, { limit: 1 });
        });
}

// function updateView() {
//     var docType = $('#inputdoctype').val();
//     var name = "playgroundcustom";
//     var mapFunction = $('#inputmap').val();

//     return cozysdk.defineView(docType, name, mapFunction)
//         .then(function() {
//              return cozysdk.run(docType, name, {
//                  limit: 1,
//                  include_docs: true,
//              });
//         });
// }

// function updateViewMock () {
//     return Promise.resolve($.getJSON('data/ex_data_event.json'));
// }

function updateFields(docType, name, mapFunction) {
    $('#inputdoctype').val(docType);
    $('#inputname').val(name);
    $('#inputmap').val(mapFunction);
}


function doThings() {

    updateView(
        $('#inputdoctype').val(),
        $('#inputname').val(),
        $('#inputmap').val()
    ).then(function() {
        return queryView(
        $('#inputdoctype').val(),
        $('#inputname').val(),
        $('#inputmap').val()
        );
    }).then(function(results) {
    //updateViewMock().then(function(results) {
        return results.map(addMetadata);

    }).then(function(results) {
        results.forEach(displayDoctype);
    });

}

function displayDoctype(fields) {
    console.log('toto');
    var docElem = $(templatedoctype({}));
    $('#container').append(docElem);
    fields.sort(function(a, b) {
        if (a.Nature === 'Metadata' && b.Nature !== 'Metadata') {
            return 1;
        } else if (a.Nature !== 'Metadata' && b.Nature === 'Metadata') {
            return -1;
        } else {
            return a.Nom > b.Nom ? 1 : -1;
        }
    }).forEach(function(field) {
        var fieldElem = $(templatefield(field));
        docElem.find('.fields').append(fieldElem);
        fieldElem.find('.toggle').click(function(ev) {
        console.log(ev);
        fieldElem.toggleClass('compact');
        fieldElem.toggleClass('expanded');
        });
    });
}

function render(field) {
    var i;
    var HTML = '';
    for (i = 0; i < field.length; i++) {
        var template = '<tr data-id="' + field[i].Nom + '">'
        + '<td><label>' + field[i].Nom +': ' + field[i].value + '</label>' + JSON.stringify(field[i]) + '</td>'
        + '</tr>';
        HTML = HTML + template;
    }
    document.querySelector('.contact-list').innerHTML = HTML;
}

document.addEventListener("DOMContentLoaded", init);

var metadata = null;

// TODO : bad name. Convert a document to a documentation piece...
function addMetadata(result) {

	var doc = result.doc;
    var fields = metadata.filter(function(field) {
        return field.DocType === doc.docType; // TODO : origin too ?
    });
    var viewedFields = {};
    var res = fields.reduce(function(obj, field) {
        if (!doc[field.Nom]) { return obj; }

        viewedFields[field.Nom] = true;
        var f = $.extend({}, field);
        f.value = doc[field.Nom];
        obj.push(f);
        return obj;
    }, []);

    for (var k in doc) {
        if (!(k in viewedFields)) {
            res.push({ Nom: k, value: doc[k] })
        }
    }

    return res;

}

function displaySubsetsPanel(subsets) {

  var byTypologies = groupByKey(subsets, 'Typologie', 'Nom');

  var typos = Object.keys(byTypologies).sort();
  typos.forEach(function(typology) {
    var typoElem = $(templatetypology({ typology: typology, subsets: byTypologies[typology] }));
    $('#typologies').append(typoElem);
    typoElem.find('.subset').click(function(ev) {
        console.log(ev);
        var subset = ev.currentTarget.innerText;
        console.log(subset);
        var data = subsets.find(function(field) {
            return field.Nom === subset;
        });

        updateFields(data.DocType,
            convertToSlug(data.Nom),
            testToMapFunction(data.Format));
        // var format = "function(doc) { emit(doc._id); }";
        queryView(data.DocType, convertToSlug(data.Nom));

        doThings();

    })
  });
}

// Split list by values of given key, in by[Key] field.
groupByKey = function(list, key, sortKey) {
  var byKey = 'by' + key[0].toUpperCase() + key.slice(1);
  var res = {};

  list.forEach(function(info) {

    var v = info[key];
    if (!v) { return; }

    if (!res[v]) {
      res[v] = [];
    }
    res[v].push(info);
  });

  if (sortKey) {
    for (var k in res) {
      res[k].sort(function(a, b) {
        if (a[sortKey] < b[sortKey]) {
          return -1;
        } else {
          return 1;
        }
      });
    }
  }
  return res;
};

function convertToSlug(Text) {
    return Text
        .toLowerCase()
        .replace(/ /g,'-')
        .replace(/[^\w-]+/g,'')
        ;
}

function testToMapFunction(test) {
    return "function(doc) {\n  " + test + "\n}\n";
}
