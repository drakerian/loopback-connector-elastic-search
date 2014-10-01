# loopback-connector-elastic-search

Basic Elasticsearch datasource connector for [Loopback](http://strongloop.com/node-js/loopback/).

## Setting up Elasticsearch
- Download and install [Elasticsearch](http://www.elasticsearch.org)
- Goto /elasticsearch-path/bin$ and execute ./elasticsearch
- Optional install [head plugin](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/modules-plugins.html)
- Open browser and goto default url: http://localhost:9200/
- To use head plugin goto: _http://localhost:9200/_plugin/head/_
- If all is ok then the result is some this:<br>


    {
        status: 200,
        name: "Arno Stark",
        version: {
            number: "1.3.2",
            build_hash: "dee175dbe2f254f3f26992f5d7591939aaefd12f",
            build_timestamp: "2014-08-13T14:29:30Z",
            build_snapshot: false,
            lucene_version: "4.9"
        },
        tagline: "You Know, for Search"
    }

## Populate for demo Elasticsearch
Run in terminal:<br>

    curl -XPUT http://localhost:9200/shakespeare -d '{
        "mappings" : {
            "_default_" : {
                "properties" : {
                    "speaker" : {"type": "string", "index" : "not_analyzed" },
                    "play_name" : {"type": "string", "index" : "not_analyzed" },
                    "line_id" : { "type" : "integer" },
                    "speech_number" : { "type" : "integer" }
                }
            }
        }
    }';

Import data example to Elasticsearch:

    cd examples/data
    curl -XPUT localhost:9200/_bulk --data-binary @shakespeare.json


## Setting up Loopback
Install StrongLoop command line interface:

    npm install -g strong-cli
Create project:

    slc loopback:loopback
    set project path and name
Attach datasource (see **/server/datasources.json**):

    slc loopback:datasource test-elastic
    select loopback-connector-elastic
Create model (see **/examples/entry.json**):

    slc loopback:model entry

## Install connector from NPM

    npm install loopback-connector-elastic-search --save

## Configuring elastic connector
Edit **datasources.json** and set:

    [ConnectorEntry] : {
        "host": [127.0.0.1],
        "port": [9200],
        "name": [Name],
        "connector": "elastic-search",
        ...
        "log": "trace",
        "defaultSize": [Rows],
        "index": [IndexName],
        "type": [TypeName]
    }
    
Required:
---------
- **Host:** Elasticsearch engine host address.
- **Port:** Elasticsearch engine port.
- **Name:** Connector name.
- **Connector:** Elasticsearch driver.

Optional:
---------
- **Log:** logging option.
- **DefaultSize:** Rows to return per page.
- **Index:** Search engine specific index.
- **Type:** Search engine specific type.

## Run example
Goto to _examples_ folder and run:
    
    npm install
    
Goto _server_ folder and run:

    node server.js

Open browse, and set in URL:

    http://localhost:3000/explorer

To test a specific filter in GET method, use for example:
    
    {"q" : "friends, romans, countrymen"}

## Release notes

  * First beta version