import fs from "fs";
import { GoogleTopTenBuilder } from "./GoogleTopTenBuilder";
import { Kache } from "./Kache";
import { Logger } from "./Logger";
import { SimpleImageWriter } from "./SimpleImageWriter";

async function run() {
    const logger: Logger = new Logger("topten-builder", "verbose");
    const cache: Kache = new Kache(logger, "topten-cache.json"); 
    const simpleImageWriter: SimpleImageWriter = new SimpleImageWriter(logger, "images");
    const topTenBuilder: GoogleTopTenBuilder = new GoogleTopTenBuilder(logger, cache, simpleImageWriter);
   
    const success: boolean = await topTenBuilder.CreateImages();

    logger.info(`test.ts: Done: ${success ? "successfully" : "failed"}`); 

    return success ? 0 : 1;
}

run();