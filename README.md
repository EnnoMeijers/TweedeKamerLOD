# TweedekamerLOD

First try on a simple tool to transform the public Tweede Kamer data into Linked Data. Tweede Kamer der Staten-Generaal is the Dutch House of Representatives, it is one of the two chambers of the Dutch parliament.

## Open Data API

The Tweede Kamer offers an open data API the offers an exentive amount of data of its business. See https://opendata.tweedekamer.nl/ for detailed information. The API is an [ODATA implementation](https://www.odata.org/).

This software reads data from selected endpoints of the ODATA API and downloads the available data as JSON. The JSON files are processed in a two step process. The first step is a automated one-to-one conversion of the JSON data into RDF using RML with a generated transformation script. The second step is a transformation of the raw RDF into RDF modelled using common ontolgies such as Schema.org. The transformation for each output type can be configured using SPARQL CONSTRUCT queries. See the [queries directory](./queries) for details.

## Installation 

```bash
$ git clone https://github.com/EnnoMeijers/TweedeKamerLOD.git

$ cd TweedeKamerLOD

$ npm install

$ npm start
```

## Configuration

To configure the download and transformation of specific datasets is done in the [configuration file](./src/config.js). 


