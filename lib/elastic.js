var
    elasticsearch = require('elasticsearch'),
    async = require('async'),
    util = require('util'),
    Connector = require('loopback-connector').Connector;

const name = 'elastic';

module.exports.name = name;

/**
 * Initialize connector with datasource, configure settings an return
 * @param dataSource
 * @param done
 */
module.exports.initialize = function (dataSource, done) {
    var settings = dataSource.settings || {};
    var connector = new ElasticSearch(settings, dataSource);
    dataSource.connector = connector;
    process.nextTick(done);
}

/**
 * Create elasticsearch connect URL
 * @param options datasource settings
 * @returns {{host: string, requestTimeout: number, log: string}}
 */
function generateElasticsearchURL(options) {
    options.host = (options.host || '127.0.0.1');
    options.port = (options.port || 9200);
    options.requestTimeout = (options.requestTimeout || 1000);
    options.log = (options.log || '');
    return {
        host: options.host + ':' + options.port,
        requestTimeout: options.requestTimeout,
        log: options.log
    }
}

/**
 * Connect with elastic seach engine
 * @param settings datasource settings
 * @constructor
 */
var ElasticSearch = function (settings, dataSource) {
    this.name = name;
    this._models = {};
    this.elasticServer = new elasticsearch.Client(generateElasticsearchURL(settings));
    this.searchType = settings.type || "";
    this.searchIndex = settings.index || "";
    this.defaultSize = (settings.defaultSize || 0);
    this.dataSource = dataSource;
    this.idField = 'id';
};

util.inherits(ElasticSearch, Connector);

/**
 * Return connector type
 * @returns {string[]}
 */
ElasticSearch.prototype.getTypes = function () {
    return [this.name];
};

/**
 * Get value from property checking type
 * @param property object
 * @param value object
 * @returns { return object }
 */
ElasticSearch.prototype.getValueFromProperty = function (property, value) {
    if (property.type instanceof Array) {
        if (!value || (value.length === 0)) {
            return new Array();
        } else {
            return new Array(value.toString());
        }
    } else if (property.type === String) {
        return value.toString();
    } else if (property.type === Number) {
        return Number(value);
    } else {
        return value;
    }
}

/**
 * Match model fields with data
 * @param {String} model The model name
 * @param {Object} data The data from DB
 * @returns { object data }
 */
ElasticSearch.prototype.matchDataToModel = function (model, data) {
    var self = this;
    if (!data) {
        return null;
    }
    try {
        var properties = this._models[model].properties;
        var document = {};

        for (var propertyName in properties) {
            var propertyValue = data[propertyName];
            if (propertyValue) {
                document[propertyName] = self.getValueFromProperty(properties[propertyName], propertyValue);
            }
        }
        return document;
    } catch (err) {
        console.trace(err.message);
        return null;
    }
}

/**
 * Convert getted data to model fields
 * @param {String} model The model name
 * @param {Object} data The data from DB
 * @returns {*}
 */
ElasticSearch.prototype.getDataToModel = function (model, data) {
    if ((!data) || (!data.found) && (data.found === false)) {
        return null;
    }
    return this.matchDataToModel(model, data._source);
};

/**
 * Get index name and type data to make query filter
 * @returns {{ object with index and type }}
 */
ElasticSearch.prototype.getIndexAndTypeQuery = function () {
    var filter = {};
    if (this.searchIndex) {
        filter['index'] = this.searchIndex;
    }
    if (this.searchType) {
        filter['type'] = this.searchType;
    }
    return filter;
}

/**
 * Make filter from criteria, data index and type
 * Ex:
 *   {"body": {"query": {"match": {"title": "Futuro"}}}}
 *   {"q" : "Futuro"}
 * @param criteria filter
 * @param size of rows to return, if null then skip
 * @param page to retrun, if null then skip
 * @returns {{object filter}}
 */
ElasticSearch.prototype.makeFilter = function (criteria, size, page) {
    var filter = this.getIndexAndTypeQuery();
    if (!size && (size != null)) {
        if (size < 1) {
            if (this.defaultSize) {
                filter['size'] = this.defaultSize;
            }
        } else {
            filter['size'] = size;
        }
    }
    if (criteria) {
        for (var criteriaItem in criteria) {
            filter[criteriaItem] = criteria[criteriaItem];
        }
    }
    return filter;
}

/**
 * Return all data from data engine
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @param {Function} [callback] The callback function
 */
ElasticSearch.prototype.all = function all(model, filter, done) {
    var self = this;
    self.elasticServer.search(
        self.makeFilter(filter, 0, 0)
    ).then(
        function (body) {
            var result = [];
            body.hits.hits.forEach(function (item) {
                result.push(self.getDataToModel(model, item));
            });
            done(null, result);
        }, function (err) {
            console.trace(err.message);
            if (err) {
                return done(err, null);
            }
        }
    );
};

/**
 * Get document Id validating data
 * @param id
 * @returns integer Id
 * @constructor
 */
ElasticSearch.prototype.GetDocumentId = function (id) {
    try {
        if (typeof id == 'string') {
            return id.toString();
        } else {
            return id;
        }
    } catch (e) {
        return id;
    }
}

/**
 * Check if a model instance exists by id
 * @param model name
 * @param id row identifier
 * @param done callback
 */
ElasticSearch.prototype.exists = function (model, id, done) {
    var self = this;
    var filter = self.getIndexAndTypeQuery();
    filter[self.idField] = this.GetDocumentId(id);
    if (!filter[self.idField]) {
        throw new Error('Document id not setted!')
    }
    self.elasticServer.exists(
        filter
    ).then(
        function (exists) {
            done(null, exists);
        }, function (err) {
            console.trace(err.message);
            if (err) {
                return done(err, null);
            }
        }
    );
};

/**
 * Find a model instance by id
 * @param model name
 * @param id document
 * @param done callback
 */
ElasticSearch.prototype.find = function find(model, id, done) {
    var self = this;
    var filter = self.getIndexAndTypeQuery();
    filter[self.idField] = this.GetDocumentId(id);
    if (!filter[self.idField]) {
        throw new Error('Document id not setted!')
    }
    self.elasticServer.get(
        filter
    ).then(
        function (response) {
            done(null, self.getDataToModel(model, response));
        }, function (err) {
            console.trace(err.message);
            if (err) {
                return done(err, null);
            }
        }
    );
};

/**
 * Delete a document by Id
 * @param model name
 * @param id document
 * @param done callback
 */
ElasticSearch.prototype.destroy = function destroy(model, id, done) {
    var self = this;
    var filter = self.getIndexAndTypeQuery();
    filter[self.idField] = self.GetDocumentId(id);
    if (!filter[self.idField]) {
        throw new Error('Document id not setted!')
    }
    self.elasticServer.delete(
        filter
    ).then(
        function (response) {
            done(null, response);
        }, function (err) {
            console.trace(err.message);
            if (err) {
                return done(err, null);
            }
        }
    );
};

/**
 * Delete all documents with param criteria
 * @param model name
 * @param filter criteria
 * @param done callback
 */
ElasticSearch.prototype.destroyAll = function destroyAll(model, filter, done) {
    var self = this;
    var filter = self.makeFilter(filter, 0, 0);
    self.elasticServer.deleteByQuery(
        filter
    ).then(
        function (response) {
            done(null, response);
        }, function (err) {
            console.trace(err.message);
            if (err) {
                return done(err, null);
            }
        }
    );
};

/**
 * Return number of rows by the where criteria
 * @param model model name
 * @param done callback function
 * @param filter filter criteria
 */
ElasticSearch.prototype.count = function count(model, done, filter) {
    var self = this;
    self.elasticServer.count(
        self.makeFilter(filter, null, null)
    ).then(
        function (response) {
            done(null, response.count);
        }, function (err) {
            console.trace(err.message);
            if (err) {
                return done(err, null);
            }
        }
    );
};

/**
 * Make id with elastic index (if exist) and base Id
 * @param baseId document own Id
 * @returns {string with Id}
 */
ElasticSearch.prototype.makeId = function (baseId) {
    var id = "";
    if (!this.GetDocumentId(baseId)) {
        return null;
    }
    if (this.searchIndex) {
        id = this.searchIndex.split('_')[0];
        if (id) {
            id += '_';
        }
    }
    id += this.GetDocumentId(baseId);
    return id;
}

/**
 * Create a new model instance
 * @param model name
 * @param data info
 * @param done callback
 */
ElasticSearch.prototype.create = function (model, data, done) {
    var self = this;
    var document = self.getIndexAndTypeQuery();
    document[self.idField] = self.makeId(data.id);
    if (!document[self.idField]) {
        throw new Error('Document id not setted!')
    }
    document["body"] = self.matchDataToModel(model, data);
    self.elasticServer.create(
        document
    ).then(
        function (response) {
            done(null, response);
        }, function (err) {
            console.trace(err.message);
            if (err) {
                return done(err, null);
            }
        }
    );
};


/**
 * Update the attributes for a model instance by id
 */
ElasticSearch.prototype.updateAttributes = function updateAttrs(model, id, data, done) {
//    db.getDocument(id, function(err, doc){
//    doc = doc || {};
//    _.extend(doc, data);
//    db.saveDocument(model, doc, done);
//  });
};

/**
 * Update document data
 * @param model name
 * @param data document
 * @param done callback
 */
ElasticSearch.prototype.save = function (model, data, done) {
    var self = this;
    var document = self.getIndexAndTypeQuery();
    document[self.idField] = self.makeId(data.id);
    if (!document[self.idField]) {
        throw new Error('Document id not setted!')
    }
    document["body"] = self.matchDataToModel(model, data);
    self.elasticServer.update(
        document
    ).then(
        function (response) {
            done(null, response);
        }, function (err) {
            console.trace(err.message);
            if (err) {
                return done(err, null);
            }
        }
    );
};

/**
 * Update a model instance or create a new model instance if it doesn't exist
 */
ElasticSearch.prototype.updateOrCreate = function updateOrCreate(model, data, done) {
    var self = this;
    var document = self.getIndexAndTypeQuery();
    document[self.idField] = self.makeId(data.id);
    if (!document[self.idField]) {
        throw new Error('Document id not setted!')
    }
    document["body"] = self.matchDataToModel(model, data);
    self.elasticServer.update(
        document
    ).then(
        function (response) {
            done(null, response);
        }, function (err) {
            console.trace(err.message);
            if (err) {
                return done(err, null);
            }
        }
    );
};