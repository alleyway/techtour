CBIC Tech Tour 2015

Installing JavaScript Libraries (only use when updating libraries)

- "npm install bower"
- "bower install" (should just use the bower.json file)
- "bower install mapbox.js"
- "bower install bootstrap"
- "bower install leaflet.markercluster"
- "bower install Leaflet/Leaflet.fullscreen"


Deployment Workflow

- Commit to master, then merge to the "gh-pages" branch and push
- Github pages is used to statically host the site and the CNAME file is the pointer for the domain (see [here.](https://help.github.com/articles/creating-project-pages-manually/))