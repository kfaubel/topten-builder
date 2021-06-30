// tslint:disable: no-var-requires
// tslint:disable: no-console
let xml2js = require('xml2js');
let axios = require('axios');

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

export class GoogleTopTenData {
    private context: any;
    private logger: any;

    constructor(context: any, logger: any) {
        this.context = context;
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

    // tslint:disable-next-line: member-ordering
    public async getData(url: string, count: number) {       

        this.logger.info(`getData - loading URL: ${url}`);
        
        const theData: object[] = [];

        await axios.get(url)
            .then((response: any) => {
                // handle success
                const topTenData: any = response.data;

                // Log the XML result
                // console.log(topTenData);

                const parser = new xml2js.Parser(/* options */);
                parser.parseStringPromise(topTenData)
                .then((result:any) => {
                    // Log the converted JSON result
                    // console.log(JSON.stringify(result, undefined, 2));

                    for(let i:number = 0; i < count; i++) {
                        const trend:any = {};
                        trend.number  = (i+1);
                        trend.title   = this.fixString(result.rss.channel[0].item[i].title[0]);
                        trend.pictureUrl =                result.rss.channel[0].item[i]['ht:picture'][0];
                        trend.details = this.fixString(result.rss.channel[0].item[i]['ht:news_item'][0]['ht:news_item_title'][0]);
                        this.logger.info(`Item ${i} - Title: ${trend.title}`);

                        theData[i] = trend;
                    }
                    
                })
                    .catch((err) => {
                        this.logger.error(err);
                    });
            })
            .catch((error: string) => {
                this.logger.error("Error: " + error);
            })
        
        // Log the final result with just 'count' items and only the 3 important fields
        // this.context.info(JSON.stringify(theData, undefined, 2));

        return theData;
    }
}