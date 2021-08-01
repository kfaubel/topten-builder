/* eslint-disable @typescript-eslint/no-unused-vars */
import * as fs from "fs";
import path from "path";
import axios, { AxiosResponse } from "axios";
import jpeg from "jpeg-js";
import * as pure from "pureimage";
import { Logger } from "./Logger.js";
import { GoogleTopTenData, TopTenItem } from "./GoogleTopTenData";

export interface ImageResult {
    expires: string;
    imageType: string;
    imageData: jpeg.BufferRet | null;
}

export class GoogleTopTenImage {
    private logger: Logger;
    private dirname: string;

    constructor(logger: Logger, dirname: string) {
        this.logger = logger;
        this.dirname = dirname;
    }

    public async getImage(dataItem: TopTenItem): Promise<ImageResult> {
        // dataItem.title 
        // dataItem.pictureUrl
        // dataItem.details

        const imageHeight = 1080; 
        const imageWidth  = 1920; 

        const backgroundColor = "rgb(250, 250, 250)";
        const textColor       = "rgb(50, 5, 250)";

        const TitleOffsetX = 100;
        const TitleOffsetY = 160;

        const DetailOffsetX = 100;
        const DetailOffsetY = 330;

        const PictureX = 600;
        const PictureY = 510;
        const PictureWidth = 400;
        const PictureHeight = 400;

        const img = pure.make(imageWidth, imageHeight);
        const ctx = img.getContext("2d");

        const fntBold     = pure.registerFont(path.join(this.dirname, "..", "fonts", "OpenSans-Bold.ttf"),   "OpenSans-Bold");
        const fntRegular  = pure.registerFont(path.join(this.dirname, "..", "fonts", "OpenSans-Regular.ttf"),"OpenSans-Regular");
        const fntRegular2 = pure.registerFont(path.join(this.dirname, "..", "fonts", "alata-regular.ttf"),   "alata-regular");
        
        fntBold.loadSync();
        fntRegular.loadSync();
        fntRegular2.loadSync();

        ctx.fillStyle = backgroundColor; 
        ctx.fillRect(0,0,imageWidth, imageHeight);

        try {
            // this.logger.info("dataItem: " + JSON.stringify(dataItem, undefined, 2));
            const response: AxiosResponse = await axios.get(dataItem.pictureUrl as string, {responseType: "stream"} );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const picture:any = await pure.decodeJPEGFromStream(response.data);
            await pure.encodeJPEGToStream(picture,fs.createWriteStream("picture.jpg"), 50);
            ctx.drawImage(picture,
                0, 0, picture.width, picture.height,             // source dimensions
                PictureX, PictureY, PictureWidth, PictureHeight  // destination dimensions
            );
        } catch (e) {
            this.logger.error("Failed to read picture: " + e);
        }

        // Draw the title
        const title = `#${dataItem.number} ${dataItem.title}`;
        const titleLines: string[] = this.splitLine(title, 25, 2);       

        for (let titleIndex = 0; titleIndex < titleLines.length; titleIndex++) { 
            ctx.fillStyle = textColor; 
            ctx.font = "120pt 'OpenSans-Bold'";
            ctx.fillText(titleLines[titleIndex], TitleOffsetX, TitleOffsetY + (titleIndex++ * 100));
        }

        const detailLines: string[] = this.splitLine(dataItem.details as string, 45, 3);

        for (let detailIndex = 0; detailIndex < detailLines.length; detailIndex++) { 
            ctx.fillStyle = textColor; 
            ctx.font = "72pt 'alata-regular'";
            ctx.fillText(detailLines[detailIndex], DetailOffsetX, DetailOffsetY + (detailIndex++ * 80));            
        }

        // Save the bitmap out to a jpeg image buffer
        const jpegImg: jpeg.BufferRet = jpeg.encode(img, 50);

        // How long is this image good for
        const goodForMins = 60;

        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + goodForMins);

        return {
            expires: expires.toUTCString(),
            imageType: "jpg",
            imageData: jpegImg
        };
    }

    private splitLine(inStr: string, maxLineLength: number, maxLines: number) {
        const list: string[] = [];

        if (maxLines < 1 || maxLines > 10) {
            this.logger.error(`splitLine: maxLines too large (${maxLines})`);
            return list;
        }

        while (inStr.length > 0) {
            let breakIndex: number;
            if (inStr.length <= maxLineLength) {
                list.push(inStr);
                return list;
            }

            breakIndex = maxLineLength - 1;
            while (breakIndex > 0 && (inStr.charAt(breakIndex) !== " ")) {
                breakIndex--;
            }

            list.push(inStr.substring(0, breakIndex));
            inStr = inStr.substring(breakIndex + 1);
        }
        return list;
    }
}