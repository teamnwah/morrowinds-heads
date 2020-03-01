# Morrowind Three.JS

A project that takes morrowind's player heads and shows it on a webpage - [see it live](https://zt.je/mw/)

![](examples/Z9x9jF6.png) ![](examples/ZmJe6PQ.png)

## Requirements

- pyFFI
- PIL / Pillow
- yarn / npm

# Setup

```bash
cd [project]
# Generate JSON meshes
./script/export_nif.py [morrowind]/Data\ Files/Meshes/b [morrowind]/Data\ Files/Textures public/blob
# Pack JS
yarn
yarn webpack
# Run dev http server via PHP e.g.
cd public;
php -S 0:8888;
```

meshes.json is not included because it's easily around 15MB