const fs = require('fs');

const axios = require('axios');
const { exit } = require('process');

//const rawdata = fs.readFileSync('./src/config.json');
const config = JSON.parse( fs.readFileSync('./src/config.json') );

// Simple download function that loops through the
// 'next' links to collect all the data from and endpoint
async function downloadEndpoint( dataset ) {
  if(dataset.skip){
    console.log(`Skipped ${dataset.endpoint}`)
    return
  }
  const odataApi = config.odataApi;
  const endpoint = odataApi + dataset.endpoint;
  const outputfile = dataset.download;
  let records = [];
  let url = endpoint;
  do {
    await axios
      .get(url)
      .then( async function (result) {
        const data = await result.data.value;
        url = result.data['@odata.nextLink']
        records.push(...data);
        console.log(".")
      })
      .catch(function (error) {
          console.log(error.code);
          url = false;
      });

  } while(url)
  fs.writeFileSync( outputfile, JSON.stringify( records ) );
  console.log( 'Written',records.length,'records from endpoint', endpoint,'to',outputfile );
}

async function runAll() {
  const datasets = config.downloadAndMap;
  return Promise.all( datasets.map( async( dataset ) => downloadEndpoint( dataset ) ) )
}

exports.runAll = runAll;