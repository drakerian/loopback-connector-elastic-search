var init = require('./init');

describe('When apply filter criteria', function () {
    var testConnector;

    before(function () {
        testConnector = getConnector();
    });

    it('should validate index and type filters', function (done) {
        var filterIndexAndType = testConnector.makeFilterIndexAndType();

        if (filterIndexAndType.index) {
            expect(filterIndexAndType.index).to.be.a('string').to.have.length.above(1).to.match(/^[a-z0-9.-_]+$/i);
        }
        if (filterIndexAndType.type) {
            expect(filterIndexAndType.type).to.be.a('string').to.have.length.above(1).to.match(/^[a-z0-9.-_]+$/i);
        }

        done();
    });

    it('should validate filter criteria', function (done) {
        var criteria, size, page;
        criteria = {"body": {"query": {"match": {"title": "Futuro"}}}};
        size = 100;
        page = 10;
        var filterCriteria = testConnector.makeFilter(criteria, size, page);
        expect(filterCriteria).not.to.be.null;
        expect(filterCriteria).to.have.property('index').that.is.a('string');
        expect(filterCriteria).to.have.property('size').that.is.a('number');
        expect(filterCriteria).to.have.property('from').that.is.a('number');
        expect(filterCriteria).to.have.property('body').that.is.an('object');

        done();
    });
});