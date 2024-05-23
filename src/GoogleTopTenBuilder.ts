/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerInterface } from "./Logger";
import { KacheInterface } from "./Kache";
import { ImageWriterInterface } from "./SimpleImageWriter";
import { GoogleTopTenData, TopTenItem } from "./GoogleTopTenData";
import { GoogleTopTenImage, ImageResult } from "./GoogleTopTenImage";
import { log } from "console";

export class GoogleTopTenBuilder {
    private logger: LoggerInterface;
    private cache: KacheInterface;
    private writer: ImageWriterInterface;

    constructor(logger: LoggerInterface, cache: KacheInterface, writer: ImageWriterInterface) {
        this.logger = logger;
        this.cache = cache; 
        this.writer = writer;
    }

    // I would prefer to use the interface commented out above but it does not work direclty.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async CreateImages(): Promise<boolean>{
        try {
            const googleTopTenData = new GoogleTopTenData(this.logger);
            const googleTopTenImage: GoogleTopTenImage = new GoogleTopTenImage(this.logger, this.cache);
            const url = "https://www.google.com/trends/hottrends/atom/feed?pn=p1"; 
            this.logger.info(`Retrieving data from: ${url}`);
            const count = 10;

            const data: Array<TopTenItem> | null = await googleTopTenData.getData(url, count);
            if (data === null) {
                this.logger.error("Failed to retrieve data from Google");
                return false;
            }

            this.logger.info("Rendering images:");
            
            for(let i = 0; i < data.length; i++) {
                let imageNumberStr = `00${i+1}`; // 01 .. 10 
                imageNumberStr = imageNumberStr.substring(imageNumberStr.length - 2); // take the last 2 digits
                const filename = `googleTopTen-${imageNumberStr}.jpg`;

                this.writer.deleteFile(filename);

                if (data[i] === undefined)
                    continue;
                    
                const item: ImageResult | null = await googleTopTenImage.getImage(data[i]);

                if (item !== null && item.imageData !== null) {
                    this.logger.log(`  Writing: ${filename} (${data[i].title})`);
                    this.writer.saveFile(filename, item.imageData?.data); 
                } 
            }
            
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            this.logger.error(`CreateImages: Exception: ${e.stack}`);
            return false;
        }

        return true;
    }
}
