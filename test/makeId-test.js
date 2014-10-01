var init = require('./init');

describe('When make id document', function () {
    var testConnector;

    before(function () {
        testConnector = getConnector();
    });

    it('should validate id created with Index filter name', function (done) {
        var id = testConnector.makeId('a');
        expect(id).not.to.be.null;
        expect(id).to.be.a('string').to.contain(testConnector.searchIndex.concat('_'));
        done();
    });
});