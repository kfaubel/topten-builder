/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerInterface } from "./Logger";
import { KacheInterface } from "./Kache";
import { ImageWriterInterface } from "./SimpleImageWriter";
import { GoogleTopTenData, TopTenItem } from "./GoogleTopTenData";
import { GoogleTopTenImage, ImageResult } from "./GoogleTopTenImage";

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
            const googleTopTenImage: GoogleTopTenImage = new GoogleTopTenImage(this.logger);
            const url = "https://www.google.com/trends/hottrends/atom/feed?pn=p1"; 
            this.logger.info(`Retrieving data from: ${url}`);
            const count = 10;

            const data: Array<TopTenItem> = await googleTopTenData.getData(url, count);

            this.logger.info("Rendering images:");
            try {
                for(let i = 0; i < data.length; i++) {
                    if (data[i] === undefined)
                        continue;
                        
                    const item: ImageResult | null = await googleTopTenImage.getImage(data[i]);

                    if (item !== null && item.imageData !== null) {
                        const filename = `googleTopTen-${i+1}.${item.imageType}`;
                        this.logger.log(`  Writing: ${filename} (${data[i].title})`);
                        this.writer.saveFile(filename, item.imageData?.data); 
                    } 
                }
            } catch (e) {
                this.logger.error(`Failure to render and save images - ${e}`);
            }
        } catch (e) {
            this.logger.error(`CreateImages: Exception: ${e}`);
            return false;
        }

        return true;
    }
}
