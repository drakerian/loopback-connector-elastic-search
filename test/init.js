var
    chai = require('chai'),
    esConnector = require('../lib/esConnector'),
    dsSettings = require('./resource/datasource-test.json');

global.expect = chai.expect;
global.assert = chai.assert;
global.should = chai.should;

global.getConnector = function () {
    var dataSource = {};
    return new esConnector.ESConnector(dsSettings, dataSource);
};