# news-builder
This is a module for building images of Google top ten search results.
* It uses pureimage as an alternative to canvas.  Its slower but no native dependencies.
* The image is jsut a thumbnail and does not look very good when blown up.

Use stand alone.  This creates 10 files in the images/ directory, one for each of the top ten items
```
$ npm install --save topten-builder
```
The following snippet shows how to use it:
```javascript
import fs from 'fs';
import { GoogleTopTenData } from 'topten-builder';
import { GoogleTopTenImage } from 'topten-builder';

saveTopTenImages() {
    const SCREEN_COUNT = 10;
    const GOOGLE_TOP_TEN_URL = "https://www.google.com/trends/hottrends/atom/feed?pn=p1";
    
    const data = await googletoptendata.getData(GOOGLE_TOP_TEN_URL, SCREEN_COUNT);
    
   for(let i: number = 0; i < ten; i++) {
       let filename = `googleTopTen-${i}.${imageList[i].imageType}`
       fs.writeFileSync(filename, imageList[i].imageData.data); 
   } 
}

saveTopTenImages();
```
