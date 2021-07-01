const fs = require('fs');
const axios = require('axios'); 
const jpeg = require('jpeg-js');
const pure = require('pureimage');

const fontDir = __dirname + "/../fonts";

export class GoogleTopTenImage {
    
    private context:any; // reserved
    private logger: any;
    
    constructor(context: any, logger: any) {
        this.context = context; // usually null
        this.logger = logger;
    }

    public async saveImageStream(dataItem:any) {
        // dataItem.title 
        // dataItem.pictureUrl
        // dataItem.details

        const imageHeight: number = 1080; // 800;
        const imageWidth: number = 1920; // 1280;

        const backgroundColor: string = 'rgb(250, 250, 250)';
        const textColor: string = 'rgb(50, 5, 250)';

        const TitleOffsetX: number = 100;
        const TitleOffsetY: number = 160;

        const DetailOffsetX: number = 100;
        const DetailOffsetY: number = 330;

        const PictureX: number = 600;
        const PictureY: number = 510;
        const PictureWidth: number = 400;
        const PictureHeight: number = 400;

        const img = pure.make(imageWidth, imageHeight);
        const ctx = img.getContext('2d');

        const fntBold = pure.registerFont(fontDir + '/OpenSans-Bold.ttf','OpenSans-Bold');
        const fntRegular = pure.registerFont(fontDir + '/OpenSans-Regular.ttf','OpenSans-Regular');
        const fntRegular2 = pure.registerFont(fontDir + '/alata-regular.ttf','alata-regular');

        fntBold.loadSync();
        fntRegular.loadSync();
        fntRegular2.loadSync();

        ctx.fillStyle = backgroundColor; 
        ctx.fillRect(0,0,imageWidth, imageHeight);

        try {
            // this.logger.info("dataItem: " + JSON.stringify(dataItem, undefined, 2));
            const response:any = await axios.get(dataItem.pictureUrl, {responseType: "stream"} );
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
        const title: string = `#${dataItem.number} ${dataItem.title}`
        const titleLines: string[] = this.splitLine(title, 25, 2);       

        let lineNumber: number = 0;
        for (const titleLine of Object.keys(titleLines)) {
            ctx.fillStyle = textColor; 
            ctx.font = "120pt 'OpenSans-Bold'";
            ctx.fillText(titleLines[titleLine], TitleOffsetX, TitleOffsetY + (lineNumber++ * 100));
        }

        lineNumber = 0;
        const detailLines: string[] = this.splitLine(dataItem.details, 45, 3);

        for (const detailLine of Object.keys(detailLines)) {
            ctx.fillStyle = textColor; 
            ctx.font = "72pt 'alata-regular'";
            ctx.fillText(detailLines[detailLine], DetailOffsetX, DetailOffsetY + (lineNumber++ * 80));            
        }

        const jpegImg = jpeg.encode(img, 50);

        return {
            imageType: "jpg",
            imageData: jpegImg
        }
    }

    private splitLine(inStr: string, maxLineLength: number, maxLines: number) {
        const list: string[] = [];

        if (maxLines < 1 || maxLines > 10) {
            this.logger.log.error(`splitLine: maxLines too large (${maxLines})`)
            return list;
        }

        while (inStr.length > 0) {
            let breakIndex: number;
            if (inStr.length <= maxLineLength) {
                list.push(inStr);
                return list;
            }

            breakIndex = maxLineLength - 1;
            while (breakIndex > 0 && (inStr.charAt(breakIndex) !== ' ')) {
                breakIndex--;
            }

            list.push(inStr.substring(0, breakIndex));
            inStr = inStr.substring(breakIndex + 1);
        }
        return list;
    }
}