// tslint:disable: no-var-requires
import { strict } from 'assert';
// tslint:disable: no-console
// lib/app.ts
//import fs = require('fs');
import fs from 'fs';
import stream = require('stream');
// import { updateArrayBindingPattern } from 'typescript';
// import util = require('util');
import { GoogleTopTenData } from './GoogleTopTenData';
import { GoogleTopTenImage } from './GoogleTopTenImage';
import { Logger } from "./Logger";

// Create a new express application instance
async function update(logger, imageDir) {
    logger.verbose("googleTopTen - app.ts: update()");

    const ten: number = 10;

    const googleTopTenData = new GoogleTopTenData(null, logger);
    const googleTopTenImage = new GoogleTopTenImage(null, logger);

    const url = "https://www.google.com/trends/hottrends/atom/feed?pn=p1"; 
    logger.info(`Loading ${url}`);

    const data:any = await googleTopTenData.getData(url, ten);
    //logger.verbose("data: " + JSON.stringify(data, undefined, 2));

    const imageList: any[] = [];

    for(let i: number = 0; i < ten; i++) {
        const item: any = await googleTopTenImage.saveImageStream(data[i]);
        imageList[i] = item;
    }

    try {
        logger.verbose(`Creating directory: ${imageDir}`);
        fs.mkdirSync(imageDir, { recursive: true })
    } catch (e) {
        logger.error(`Failure to create directory ${imageDir} - ${e}`)
    }

    try {
        for(let i: number = 0; i < ten; i++) {
            let filename = `${imageDir}/googleTopTen-${i}.${imageList[i].imageType}`
            logger.verbose(`Writing file: ${filename}`);
            fs.writeFileSync(filename, imageList[i].imageData.data); 
        } 
        logger.info(`${ten} images updated to ${imageDir}`)
    } catch (e) {
        logger.error(`Failure to save images ${imageDir} - ${e}`)
    }
}

async function main() {
    const logger = new Logger("googleTopTen");
    
    let imageDir = "images";
    
    logger.verbose(`Working Directory: ${imageDir}`);
    logger.verbose('====================================');

    update(logger, imageDir); 
                
    logger.verbose("Done.");
}

main();