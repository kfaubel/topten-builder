import axios, { AxiosResponse } from "axios";
import xml2js from "xml2js";
import { LoggerInterface } from "./Logger.js";

// Sample from GET of the url
//  <?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
//    <rss version="2.0" xmlns:ht="http://www.google.com/trends/hottrends" xmlns:atom="http://www.w3.org/2005/Atom">
//      <channel>
//        <title>Hot Trends</title>
//        ...
//        <item>
//  *       <title>Portland Weather</title>
//          ...
//  *       <ht:picture>//t1.gstatic.com/images?q=tbn:ANd9GcSqgIRL8a12lCZ5R7Yu1KHc_GPTEUF0BjUk-Mv8AMUjAdT22XKu6PZzIt-mg9w4vpQtBHjlsuyD</ht:picture>
//          ...
//          <ht:news_item>
//   *        <ht:news_item_title>A foot of snow has fallen and it&amp;#39;s not over yet</ht:news_item_title>
//            <ht:news_item_snippet>&lt;b&gt;PORTLAND&lt;/b&gt;, Ore. -- Snow will continue until early Wednesday afternoon in the &lt;b&gt;Portland&lt;/b&gt; area, adding 2 to five 5 to the foot that fell overnight, according to the National &lt;b&gt;Weather&lt;/b&gt; Service. Snow began sticking in &lt;b&gt;Portland&lt;/b&gt; at around 5 p.m, and then fell at &lt;b&gt;...&lt;/b&gt;</ht:news_item_snippet>
//            <ht:news_item_url>http://www.kgw.com/weather/more-snow-already-on-the-horizon-after-ice-storm/384529373</ht:news_item_url>
//            <ht:news_item_source>kgw.com</ht:news_item_source>
//          </ht:news_item>
//        </item>
//        <item>
//          ...

// Converted JSON
// "rss": {
//     "channel": [
//       {
//         "item": [
//           {
//             "title": [ "Jerry Stiller" ],
//             "ht:approx_traffic": [ "2,000,000+" ],
//             "ht:picture": [ "https://t1.gstatic.com/images?q=tbn:ANd9GcRLkHoSxrtQTPZNN3OJV3kVdj3hh0kMC-zlaiL9a0KgMpeKCOI8zejz4kGXvEuI_YUSZv_i4oUP" ],
//             "ht:news_item": [
//               {
//                 "ht:news_item_title": [ "In Jerry Stiller, the Rage of Jewish Fathers Found a Hilarious Outlet" ],
//                 "ht:news_item_url": [ "https://www.nytimes.com/2020/05/11/arts/television/jerry-stiller-remembrance.html" ],
//               }
//             ]
//           },
//           {
//             "title"    
//             ...
//           }
//         ]
//       }
//       
//     }
// } 

export interface TopTenItem {
    number?: number;
    title?: string;
    pictureUrl?: string;
    details?: string;
    pubDate?: Date;
    source?: string;
}

export class GoogleTopTenData {
    private logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this.logger = logger;
    }

    private fixString(inStr: string) {
        let outStr = inStr;
        outStr = outStr.replace(/&amp;/g, "&");
        outStr = outStr.replace(/<b>/g, "");
        outStr = outStr.replace("</b>", "");    // TODO fix - (/</b>/g, "")
        outStr = outStr.replace(/&#39;/g, "'");

        return outStr;
    }

    public async getData(url: string, count: number): Promise<Array<TopTenItem>> {         
        const topTenList: Array<TopTenItem> = [];

        try {
            const response: AxiosResponse = await axios.get(url, {timeout: 10000});
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const topTenData: any = response.data;

            const parser = new xml2js.Parser(/* options */);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const topTenJson: any = await parser.parseStringPromise(topTenData);
               
            // this.logger.log(JSON.stringify(topTenJson, undefined, 2));

            for(let i = 0; i < count; i++) {
                const trend: TopTenItem = {};
                trend.number = i+1;
                try {
                    trend.title   = this.fixString(topTenJson.rss.channel[0].item[i].title[0]);
                    trend.pictureUrl =             topTenJson.rss.channel[0].item[i]["ht:picture"][0];
                    trend.details = this.fixString(topTenJson.rss.channel[0].item[i]["ht:news_item"][0]["ht:news_item_title"][0]);
                    trend.source  = this.fixString(topTenJson.rss.channel[0].item[i]["ht:news_item"][0]["ht:news_item_source"][0]);
                    trend.pubDate = new Date(topTenJson.rss.channel[0].item[i]["pubDate"][0]);

                    topTenList[i] = trend;
                } catch (e) {
                    this.logger.log(`getData: elements are missing for trend ${i+1}`);
                }
            }
        } catch (e) {
            this.logger.error("Read article data: " + e);
        }
        
        return topTenList;
    }
}