Quelques étapes, pour se lancer dans le développement d'application MesInfos sur Cozy ! Ces étapes vous permettrons de décourvrir toutes les spécificités de Cozy : intégrer une application, et comment accèder aux données. Une fois ces étapes maîtrisées, vous pourrez utiliser le framework javascript que vous souhaitez (angular, react, ...)

# 1 - Mettez en place votre environnement de développement

Ces étapes ont été testées pour Mac et Linux. Pour Windows, nous n'avons pas encore de solution simple et fonctionnelle à présenter. Mais ces instructions fonctionne bien dans une machine virtuelle Linux.

Afin de pouvoir développer votre application, en ayant accès aux données ; vous aurez besoin, de mettre en place votre environement de développement :


## Installez les dépendances

* git : utilisez la version de votre distribution (linux :  apt install git), ou via  [Git SCM](https://git-scm.com/downloads)
* Docker : [www.docker.com](https://www.docker.com/) --> _Get Docker_ et suiver les instructions correspondant à votre environment.


## Préparer l'environement

Dans le répertoire qui vous plaît, créer les dossier

* `cozy_dev`
* `cozy_dev/docker_things`

Placez-vous dans le répertoire `cozy_dev` puis téléchargez l'application mesinfos-dev :
`git clone http://github.com/jacquarg/mesinfos-dev`

Enfin, pour que l'image Cozy fonctionne sur votre poste en local, vous devez ajouter la ligne suivante à votre fichier `/etc/hosts`

`127.0.0.1    mesinfos-dev.cozy.tools app.cozy.tools cozy.tools`


## Testez : démarrer l'app MesINFOS-DEV En local

Placez vous dans le répertoire cozy_dev, puis lancer la commande suivante pour démarrer l'app files avec la stack Cozy :

```bash
sudo docker run --rm -it --name=cozydev -p 8080:8080 -p 5984:5984 -v "$(pwd)/docker_things/db":/usr/local/couchdb/data -v "$(pwd)/docker_things/storage":/data/cozy-storage -v "$(pwd)/mesinfos-dev3":/data/cozy-app/mesinfos-dev  cozy/cozy-app-dev
```

Puis rendez-vous sur http://mesinfos-dev.cozy.tools:8080 (mot de passe : cozy )

## Problèmes courrants :

* _`Page indisponibles` : attention à bien aller sur http://mesinfos-dev.cozy.tools:8080 , le navigateur peu vous rediriger automatiquement sur http://files.cozy.tools:8080 après le login ..._
* _`manifest not found` : vérifiez que cozy_dev/mesinfos-dev/manifest.webapp existe. Si ce n'est pas le cas, supprimez le dossier, et re-téléchargez là (`git clone http://github.com/jacquarg/mesinfos-dev`)
* `Unable to find image 'cozy/cozy-app-dev:latest' locally docker: Error response from daemon`: essayez la commande `sudo docker pull cozy/cozy-app-dev`

# 2 - B-A-BA sur Cozy

_Votre premier Hello World sur Cozy_

Vous allez ici pouvoir créer l'applicaiton hellomesinfos, qui vous fera découvrir les rudiments de Cozy.

Une application pour Cozy se compose au minimum de deux fichiers :

* `manifest.webapp` : un petit fichier texte, qui décrit l’application : son nom, les permissions dont elle a besoin, etc. (Vous trouverez [ici](https://github.com/cozy/cozy-stack/blob/master/docs/apps.md#the-manifest) une description des champs disponibles, pour l'instant on va s'appuyer sur un exemple) ;
* `index.html` : contenant le code de la page principale de l’application.

Ces deux fichiers seront analysés par le Cozy.
Dans le fichier index.html le Cozy va injecter des informations utiles :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <!-- {{.CozyClientJS}} sera remplacé par la balise HTML injectant le script de la bibliothèque cozy-client-js. -->
  {{.CozyClientJS}}
  <title>Hello MesInfos</title>
</head>
<body>
  <div role="application" data-cozy-token="{{.Token}}" data-cozy-domain="{{.Domain}}" class="container-fluid" data-cozy-app-name="{{.AppName}}" >
  <!--
{{.Token}} sera remplacé par le jeton permettant d’identifier votre application auprès du serveur ; data-cozy-icon-path="{{.IconPath}}" >
{{.Domain}} sera remplacé par l’URL du point d’entrée de l’API ;
{{.Locale}} sera remplacé par la langue de l’instance ;
{{.AppName}} sera remplacé par le nom de l’application ;
{{.IconPath}} sera replacé par la balise HTML permettant d’afficher la /favicon/ de l’application ; -->
    <H1>Hello Ynov'</H1>
  </div>
</body>
</html>
```

Créez le dossier de votre application : `cozy_dev/hellomesinfos`
Puis Copiez ce fichier dans `cozy_dev/hellomesinfos/index.html`

Et copiez également le manifest.webapp ci-dessous dans `cozy_dev/hellomesinfos/manifest.webapp`

```json
{
  "name": "Hello-Ynov",
  "slug": "app",
  "icon": "/icon.svg",
  "description": "Hello World !",
  "developer": {
    "name": "Fing",
    "url": "http://mesinfos.fing.org"
  },
  "default_locale": "fr",
  "routes": {
    "/": {
    "folder": "/",
    "index": "index.html",
    "public": false
    }
  },
  "version": "3.0.0",
  "licence": "AGPL-3.0",
  "permissions": {
    "settings": {
      "description": "Required by the cozy-bar to display Claudy and know which applications are coming soon",
      "type": "io.cozy.settings",
      "verbs": [
        "GET"
      ]
    },
    "apps": {
    "description": "Required by the cozy-bar to display the icons of the apps",
    "type": "io.cozy.apps",
    "verbs": ["GET"]
    }
  }
}
```

Puis, ajouter app à `/etc/hosts` : `127.0.0.1    app.cozy.local`

Vous pouvez maintenant tester votre application, en la lançant dans l'environement docker :

```bash
sudo docker run --rm -it --name=cozydev -p 8080:8080 -p 5984:5984 -v "$(pwd)/docker_things/db":/usr/local/couchdb/data -v "$(pwd)/docker_things/storage":/data/cozy-storage -v "$(pwd)/mesinfos-dev":/data/cozy-app/mesinfos-dev -v "$(pwd)/hellomesinfos":/data/cozy-app/app  cozy/cozy-app-dev
```

En suivant le lien [http://app.cozy.tools:8080](http://app.cozy.tools:8080) , vous découvrirez votre application !


# 3 - Manipuler les données MesInfos

## Utiliser MesInfos-dev

Rendez-vous sur [http://mesinfos-dev.cozy.tools:8080](http://mesinfos-dev.cozy.tools:8080)

Avec cette application, vous pourrez :

* Observez les données,
* Ajouter des jeux de données de synthèse  (données personelles du personnage fictif Germaine Dupone) dans votre Cozy.
* Formuler et tester des requêtes pour récupérer ces données.


## Un exemple : Récupérer l'adresse postale

1. Trouver ces données grâce à mesinfos-dev :
 a. Dans l'application mesinfos-dev, affichez le type de données Client EDF ( Onglet **Profil –> Client EDF**).
 b. Si nécéssaire, ajouté le jeu de données via le bouton bleu **"insérer dans le Cozy"**.
 c. Dans le cadre _Requêtes au datasystem_, vous pouvez observer comment est construite la requête.
 d. Dans le cadre _Données_, vous pouvez visualiser les données, sélectionnées par la requête. Vous pourrez ainsi retrouver le champs **address** et sa structure.
2. Utilisons cela pour notre application hellomesinfos'

a - Ajoutons les autorisation nécessaires pour accéder au doctype "org.fing.mesinfos.client" dans le manifest.webapp : pour cela, il faut ajouter le paramètre suivant :
```json
...
    "client": {
      "description": "Try data request and add synthetics datasets.",
      "type": "org.fing.mesinfos.client",
      "verbs": ["GET"]
},
...
```

à l'objet permission. Attention à bien vérifier la validité du fichier (format json) à la fin !

Vous devriez obtenir quelque chose de ce genre :
```json
  ...
  ...
  "version": "3.0.0",
  "licence": "AGPL-3.0",
  "permissions": {
    "apps": {
    "description": "Required by the cozy-bar to display the icons of the apps",
    "type": "io.cozy.apps",
    "verbs": ["GET"]
    },
    "client": {
      "description": "Try data request and add synthetics datasets.",
      "type": "org.fing.mesinfos.client",
      "verbs": ["GET"]
    }
  }
}
```

b - Écrire le script javascript (`hellomesinfos/app.js`), pour récupérer l'adresse (en recopiant le cadre _Requête au data system de MesInfos-dev_) et l'affichée dans l'application :

```javascript
document.addEventListener('DOMContentLoaded', function() {
  var app = document.querySelector('[role=application]');
  cozy.client.init({
    cozyURL: '//' + app.dataset.cozyDomain,
    token: app.dataset.cozyToken,
  });

  cozy.client.data.defineIndex(
    "org.fing.mesinfos.client",
    ["vendor"]
  ).then(function(index) { return cozy.client.data.query(
    index,
    {
      "selector": { "vendor": "EDF" },
      limit: 1,
    });
  }).then(function(clients) {
    var elem = document.querySelector('#address');
    elem.innerHTML = clients[0].address.formated;
  });
});
```

c - Ajouter le script, et les éléments d'interface dans hellomesinfos/index.html :

```html
...
<body>
  <div role="application" data-cozy-token="{{.Token}}" data-cozy-domain="{{.Domain}}" class="container-fluid" data-cozy-app-name="{{.AppName}}" >
    <H1>Hello MesInfos</H1>

    <p>J'habite au <span id='address'>...</span></p>

  </div>
  <script src='/app.js' ></script>
</body>
...
```

d - Testez ! [http://app.cozy.tools:8080](http://app.cozy.tools:8080) (rafraichissez la page ci-besoin : F5)


_That's all folks !_

Pour aller plus loins, consultez la [FAQ](./faq.md)
