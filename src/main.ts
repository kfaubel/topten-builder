import fs from 'fs';
import { GoogleTopTenData } from './GoogleTopTenData';
import { GoogleTopTenImage } from './GoogleTopTenImage';
import { Logger } from "./Logger";

// Create a new express application instance
async function update(logger, imageDir) {
    const count: number = 10;

    const googleTopTenData = new GoogleTopTenData(null, logger);
    const googleTopTenImage = new GoogleTopTenImage(null, logger);

    const url = "https://www.google.com/trends/hottrends/atom/feed?pn=p1"; 
    logger.info(`Retrieving data from: ${url}`);

    const data:any = await googleTopTenData.getData(url, count);
    //logger.verbose("data: " + JSON.stringify(data, undefined, 2));

    try {
        fs.mkdirSync(imageDir, { recursive: true })
    } catch (e) {
        logger.error(`Failure to create directory ${imageDir} - ${e}`)
    }

    const imageList: any[] = [];

    logger.info(`Rendering images:`);
    try {
        for(let i: number = 0; i < count; i++) {
            const item: any = await googleTopTenImage.saveImageStream(data[i]);

            let filename = `${imageDir}/googleTopTen-${i+1}.${item.imageType}`
            logger.verbose(`  Writing: ${filename} (${data[i].title})`);
            fs.writeFileSync(filename, item.imageData.data); 
        }
    } catch (e) {
        logger.error(`Failure to render and save images - ${e}`)
    }
}

async function main() {
    const logger: Logger = new Logger("googleTopTen"); 
    const imageDir: string = "images";

    await update(logger, imageDir); 
                
    logger.verbose("Done.");
}

main();