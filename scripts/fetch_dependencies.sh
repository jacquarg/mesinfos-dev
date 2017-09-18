cd vendor/
wget -O prototype-ld.js https://raw.githubusercontent.com/jacquarg/prototype-ld/master/index.js
wget -O cozy_usetracker.js https://raw.githubusercontent.com/jacquarg/cozy-usetracker/master/cozy_usetracker.js

cd ../data/wikiapi
wget  -O items.json http://mesinfos.fing.org/cartographies/wikiapi/items.json
wget -O cozy_doctypes.json http://mesinfos.fing.org/cartographies/wikiapi/indexes/cozy_doctypes.json
wget -O mesinfos_datasets.json http://mesinfos.fing.org/cartographies/wikiapi/indexes/mesinfos_datasets.json
