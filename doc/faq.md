# FAQ

_Questions fréquentes sur le développement d'application pour Cozy_

* Plus de documentation Cozy (plusieurs pages html, cozy-bar,  –>  https://cozy.github.io/cozy-docdev-v3/fr/intro.html
* Plus d'aide de la part de Cozy : –> irc freenode :  #cozycloud
* Mettre à jour mesinfos-dev : se placer dans cozy-dev/mesinfos-dev3 puis, `git pull`
* Installer l'application files dans votre environement de développement (et ajouter des fichiers de test):
 1. placez-vous dans cozy_dev
 2. téléchargez l'application : `git clone --branch build --single-branch https://github.com/cozy/cozy-files-v3`
 3. Ajouter files.cozy.local dans votre `/etc/hosts` : `127.0.0.1  files.cozy.local`
 4. Indiquer à la stack Cozy (au docker) de servir cette application, en ajoutant le paramètre : `-v "$(pwd)/cozy-files-v3":/data/cozy-app/files`
 C'est à dire :
```bash
sudo docker run --rm -it --name=cozydev3 -p 8080:8080 -p 5984:5984 -v "$(pwd)/docker_things/db":/usr/local/couchdb/data -v "$(pwd)/docker_things/storage":/data/cozy-storage -v "$(pwd)/mesinfos-dev3":/data/cozy-app/mesinfos-dev -v "$(pwd)/cozy-files-v3":/data/cozy-app/files -v "$(pwd)/hellomesinfos":/data/cozy-app/app  cozy/cozy-app-dev
```

* Installer l'application photos (idem) :
 1. placez-vous dans cozy_dev
 2. téléchargez l'application : `git clone --branch build --single-branch https://github.com/cozy/cozy-photos-v3`
 3. Ajouter photos.cozy.local dans votre `/etc/hosts` : `127.0.0.1  photos.cozy.local`
 4. Indiquer à la stack Cozy (au docker) de servir cette application, en ajoutant le paramètre : `-v "$(pwd)/cozy-photos-v3":/data/cozy-app/photos`
 C'est à dire :
  ```sh
  sudo docker run --rm -it --name=cozydev3 -p 8080:8080 -p 5984:5984 -v "$(pwd)/docker_things/db":/usr/local/couchdb/data -v "$(pwd)/docker_things/storage":/data/cozy-storage -v "$(pwd)/mesinfos-dev3":/data/cozy-app/mesinfos-dev -v "$(pwd)/cozy-files-v3":/data/cozy-app/files -v "$(pwd)/cozy-photos-v3":/data/cozy-app/photos -v "$(pwd)/hellomesinfos":/data/cozy-app/app  cozy/cozy-app-dev
  ```
* Dans une app servie par la stack Cozy, les ressources externes (servies depuis un autre domaine que celui de l'app) sont bloquées avec des CSP. Si vous avez besoin de charger des ressources extérieures, comme des maps/CDNs, vous pouvez localement désactiver le support des CSP, par exemple en installant l'extension https://chrome.google.com/webstore/detail/disable-content-security/ieelmcmcagommplceebfedjlakkhpden  dans Chrome/Chromium
