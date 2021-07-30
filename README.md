# topten-builder
This is a module for building images of Google top ten search results.
* It uses pureimage as an alternative to canvas.  Its slower but no native dependencies.
* The image is jsut a thumbnail and does not look very good when blown up.

I am slowly working on an applicaiton that will just cycle through images with this, news, weather, sports, etc.  This module will be part of that larger application but it may be useful for others.

This creates 10 files in the current directory, one for each of the top ten items
```
$ mkdir top-ten-test
$ cd top-ten-test
$ npm init
$ npm install --save topten-builder
< save code below to index.js>
$ node index.js

```
The following sample index.js shows how to use it:
```javascript
const fs = require('fs');
const topten = require('topten-builder');

const { GoogleTopTenData, GoogleTopTenImage, Logger } = topten;

// module requires a logger that can be part of a bigger package
// This uses the minimal set of methods to work using just the console.
const logger = {};
logger.info = (...args) => {console.log(...args)};
logger.verbose = (...args) => {console.debug(...args)};
logger.warn = (...args) => {console.warn(...args)};
logger.error = (...args) => {console.error(...args)};

async function saveTopTenImages() {
    const googleTopTenData = new GoogleTopTenData(null, logger);
    const googleTopTenImage = new GoogleTopTenImage(null, logger);

    const url = "https://www.google.com/trends/hottrends/atom/feed?pn=p1"; 

    const data = await googleTopTenData.getData(url, 10);

    for(let i = 0; i < 10; i++) {
        const item = await googleTopTenImage.saveImageStream(data[i]);

        let filename = `googleTopTen-${i+1}.${item.imageType}`
        logger.verbose(`Writing file: ${filename} (${data[i].title})`);
        fs.writeFileSync(filename, item.imageData.data); 
    }  
}

saveTopTenImages();
```
