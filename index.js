/* eslint-disable @typescript-eslint/no-var-requires */
// This is used when embedding this in a larger solution
// Use app.ts for local testing and to build a stand alone solution

const GoogleTopTenImage = require("./build/GoogleTopTenImage");
const GoogleTopTenData  = require("./build/GoogleTopTenData");
module.exports = { GoogleTopTenData, GoogleTopTenImage };