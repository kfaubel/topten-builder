import fs from "fs";
import { GoogleTopTenData, TopTenItem } from "./GoogleTopTenData";
import { GoogleTopTenImage, ImageResult } from "./GoogleTopTenImage";
import { Logger } from "./Logger";

// Create a new express application instance
async function update(logger: Logger, imageDir: string) {
    const count = 10;

    const googleTopTenData = new GoogleTopTenData(logger);
    const googleTopTenImage = new GoogleTopTenImage(logger, __dirname);

    const url = "https://www.google.com/trends/hottrends/atom/feed?pn=p1"; 
    logger.info(`Retrieving data from: ${url}`);

    const data: Array<TopTenItem> = await googleTopTenData.getData(url, count);
    //logger.verbose("data: " + JSON.stringify(data, undefined, 2));

    try {
        fs.mkdirSync(imageDir, { recursive: true });
    } catch (e) {
        logger.error(`Failure to create directory ${imageDir} - ${e}`);
    }

    logger.info("Rendering images:");
    try {
        for(let i = 0; i < count; i++) {
            const item: ImageResult | null = await googleTopTenImage.getImage(data[i]);

            if (item !== null) {
                const filename = `${imageDir}/googleTopTen-${i+1}.${item.imageType}`;
                logger.verbose(`  Writing: ${filename} (${data[i].title})`);
                fs.writeFileSync(filename, item.imageData?.data); 
            } 
        }
    } catch (e) {
        logger.error(`Failure to render and save images - ${e}`);
    }
}

async function main() {
    const logger: Logger = new Logger("googleTopTen"); 
    const imageDir = "images";

    await update(logger, imageDir); 
                
    logger.verbose("Done.");
}

main();