var init = require('./init');

describe('When set elastic client options', function () {
    var testConnector;

    before(function () {
        testConnector = getConnector();
    });

    it('should return number for defaultSize option', function (done) {
        expect(testConnector.defaultSize).to.be.a('number').to.be.at.least(0);
        done();
    });

    it('should return string type for searchIndex and searchType', function (done) {
        expect(testConnector.searchIndex).to.be.a('string');
        expect(testConnector.searchType).to.be.a('string');
        done();
    });

    it('should return a valid URL for elastic client', function (done) {
        var clientURL = testConnector.getESClientURL(testConnector.settings);
        expect(clientURL).not.to.be.null;
        expect(clientURL.host).to.be.a('string').to.match(/^[a-z0-9.]+:[0-9]/);
        done();
    });
});