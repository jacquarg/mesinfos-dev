# Data playground App

Un outils pour les développeurs autours des données du Pilote MesInfos :
* Installer un jeu de données de synthèse.
* Visualiser les données et leur documentation.
* Tester des requêtes pour obtenir les données.

# TODO

## Bugs
* Update UX
* Handle big fixtures addition.
* Better feedback while waiting for request : Chronometer "be carefull, your app will be that slow on startup"
* Requests preload


## Features
* Add Doctype and Subset documentation --> running
* Display the true cozysdk response tree.
* Detect new doctypes
* Add a custom synth dataset


## Requirements

You'll need a valid node.js/npm environment to develop the app. We use [Brunch](http://brunch.io/) as build tool and [bower](http://bower.io/) for the dependencies so you want them installed on your system:

```sh
$ npm -g i brunch bower
```

Before trying to develop the front app, you need to load its dependencies:

```sh
npm i
bower install
```

_NOTE:_ we currently use Bower as deps manager to avoid deps in the app repository. We'll replace it by npm node_modules packages when Brunch will be stable enough to use it for the vendor files.


## Librairies

You should be aware of the app libraries in use:
* [Backbone](http://backbonejs.org/) is used for a quick and valid components architecture, like models
* [Marionette](http://marionettejs.com/) is the framework used upon Backbone to have a more clever and easier way to deal with views (like layouts, regions, and views switching)
* [BackboneProjections](https://github.com/andreypopp/backbone.projections) offers a lean way to keep context collections (like search filtering, etc) consistent over the whole app
* [Backbone.ViewModel](https://github.com/cozy-labs/backbone.viewmodel) keeps logics externally to views rendering part, and gets contextual stores


## Architecture

### Files structure


# About MesInfos
