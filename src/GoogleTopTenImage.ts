/* eslint-disable @typescript-eslint/no-unused-vars */
import path from "path";
import axios, { AxiosResponse } from "axios";
import jpeg from "jpeg-js";
import * as pure from "pureimage";
import { LoggerInterface } from "./Logger.js";
import { KacheInterface } from "./Kache.js";
import { TopTenItem } from "./GoogleTopTenData";
import { ImageLibrary, MyImageType } from "./ImageLibrary.js";

export interface ImageResult {
    expires: string;
    imageType: string;
    imageData: jpeg.BufferRet | null;
}

export class GoogleTopTenImage {
    private logger: LoggerInterface;
    private cache: KacheInterface;
    private imageLibrary: ImageLibrary;

    constructor(logger: LoggerInterface, cache: KacheInterface) {
        this.logger = logger;
        this.cache = cache;
        this.imageLibrary = new ImageLibrary(logger, cache);
    }

    // This optimized fillRect was derived from the pureimage source code: https://github.com/joshmarinacci/node-pureimage/tree/master/src
    // To fill a 1920x1080 image on a core i5, this saves about 1.5 seconds
    // x, y       - position of the rect
    // w, h       - size of the rect
    // iw         - width of the image being written into, needed to calculate index into the buffer
    // r, g, b, a - values to draw
    private myFillRect(image: Buffer, x: number, y: number, w: number, h: number, iw: number, r: number, g: number, b: number, a: number) {
        for(let i = y; i < y + h; i++) {                
            for(let j = x; j < x + w; j++) {   
                const index = (i * iw + j) * 4;     
                image[index + 0] = r; 
                image[index + 1] = g; 
                image[index + 2] = b; 
                image[index + 3] = a; 
            }
        }
    }

    public async getImage(dataItem: TopTenItem): Promise<ImageResult | null> {
        // dataItem.title 
        // dataItem.pictureUrl
        // dataItem.details

        const imageHeight     = 1080; 
        const imageWidth      = 1920; 

        const backgroundColor = "rgb(250, 250, 250)";
        const textColor       = "rgb(50, 5, 250)";

        const TitleOffsetX    = 100;
        const TitleOffsetY    = 160;
        const TitleWidth      = imageWidth - (TitleOffsetX + 100);
        const TitleSpacingY   = 110;

        const DetailOffsetX   = 100;
        const DetailOffsetY1  = 280; // If there was only one row of the title
        const DetailOffsetY2  = 360; // If there was two rows in the title
        const DetailWidth     = imageWidth - (DetailOffsetX + 100);
        const DetailSpacingY  = 80;

        const PictureX        = 600;
        const PictureY        = 550;
        const PictureWidth    = 400;
        const PictureHeight   = 400;

        const CreditOffsetX   = 60;
        const CreditOffsetY   = 20; // up from the bottom

        const img = pure.make(imageWidth, imageHeight);
        const ctx = img.getContext("2d");

        // When used as an npm package, fonts need to be installed in the top level of the main project
        const fntBold     = pure.registerFont(path.join(".", "fonts", "OpenSans-Bold.ttf"),"OpenSans-Bold");
        const fntRegular  = pure.registerFont(path.join(".", "fonts", "OpenSans-Regular.ttf"),"OpenSans-Regular");
        const fntRegular2 = pure.registerFont(path.join(".", "fonts", "alata-regular.ttf"),"alata-regular");
        
        fntBold.loadSync();
        fntRegular.loadSync();
        fntRegular2.loadSync();

        const titleFont     = "120pt 'OpenSans-Bold'";
        const detailFont    = "72pt 'OpenSans-Bold'";
        const creditFont    = "24pt 'OpenSans-Bold'";

        ctx.fillStyle = backgroundColor; 
        //ctx.fillRect(0,0,imageWidth, imageHeight);
        this.myFillRect(img.data, 0, 0, imageWidth, imageHeight, imageWidth, 0xF0, 0xF0, 0xF0, 0);



        try {

            let picture: MyImageType | null = null; 

            if (typeof dataItem.pictureUrl === "string" && dataItem.pictureUrl !== "") {
                picture = await this.imageLibrary.getImage(dataItem.pictureUrl, PictureHeight);
            } else {
                this.logger.warn(`getImage: Invalid image URL for ${dataItem.title}`);
                picture = null;
            }

            if (picture === null) {
                return null;
            }

            ctx.drawImage(picture,
                0, 0, picture.width, picture.height,             // source dimensions
                PictureX, PictureY, PictureWidth, PictureHeight  // destination dimensions
            );
        } catch (e) {
            this.logger.error("Failed to read picture: " + e);
            return null;
        }

        // Draw the title
        ctx.fillStyle = textColor; 
        ctx.font = titleFont;
        const title = `#${dataItem.number} ${dataItem.title}`;
        const titleLines: string[] = this.splitLine(title, ctx, TitleWidth, 2);       

        for (let titleIndex = 0; titleIndex < titleLines.length; titleIndex++) { 
            ctx.fillText(titleLines[titleIndex], TitleOffsetX, TitleOffsetY + (titleIndex * TitleSpacingY));
        }

        ctx.fillStyle = textColor; 
        ctx.font = detailFont;
        const detailLines: string[] = this.splitLine(dataItem.details as string, ctx, DetailWidth, 3);

        // If the title took two rows, we need a little tighter spacing
        const offsetY = (titleLines.length == 1) ? DetailOffsetY1 : DetailOffsetY2;

        for (let detailIndex = 0; detailIndex < detailLines.length; detailIndex++) { 
            ctx.fillText(detailLines[detailIndex], DetailOffsetX, offsetY + (detailIndex * DetailSpacingY));            
        }

        // Draw credits at the bottom
        const localDate: string = (dataItem.pubDate === undefined) ? "unknown" : dataItem.pubDate.toLocaleString();
        const credits = `Source: ${dataItem.source}, via Google Top Ten on: ${localDate}`;
        
        ctx.fillStyle = textColor; 
        ctx.font = creditFont;
        ctx.fillText(credits, CreditOffsetX, imageHeight - CreditOffsetY);
    
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private splitLine(inStr: string, ctx: any, maxPixelLength: number, maxLines: number) {
        const list: string[] = [];

        if (maxLines < 1 || maxLines > 10) {
            this.logger.error(`splitLine: maxLines too large (${maxLines})`);
            return list;
        }
        
        while (inStr.length > 0) {
            let breakIndex: number;
            if (ctx.measureText(inStr).width <= maxPixelLength) {
                list.push(inStr);
                return list;
            }

            breakIndex = inStr.length - 1;
            let activeLine = "";
            while (breakIndex > 0) {
                if (inStr.charAt(breakIndex) === " ") {
                    activeLine = inStr.substring(0, breakIndex);
                    if (ctx.measureText(activeLine).width <= maxPixelLength) {
                        break;
                    } 
                }
                breakIndex--;
            } 
            
            list.push(inStr.substring(0, breakIndex));
            inStr = inStr.substring(breakIndex + 1);

            if (list.length >= maxLines)
                break;
        }
        return list;
    }

    private splitLineOld(inStr: string, maxLineLength: number, maxLines: number) {
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