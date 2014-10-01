var
    init = require('./init'),
    modelTest = require('./resource/model-test.json'),
    mockTest = require('./resource/mock-data-test');

describe('When convert elastic result to loopback model', function () {
    var testConnector;
    var dataModeled = {};

    before(function () {
        testConnector = getConnector();
        testConnector._models.test = modelTest;
    });

    it('should run convert function', function (done) {
        dataModeled = testConnector.matchDataToModel("test", mockTest);
        expect(dataModeled).not.to.be.null;
        done();
    });

    it('should validate matched fields', function (done) {
        expect(dataModeled.play_name).to.exist;
        expect(dataModeled.speech_number).to.exist;
        expect(dataModeled.line_number).to.exist;
        expect(dataModeled.speaker).to.exist;
        expect(dataModeled.test_object).to.exist;

        expect(dataModeled.line_id).to.not.exist;
        expect(dataModeled.text_entry).to.not.exist;

        done();
    });

    it('should validate data types', function (done) {
        expect(dataModeled.play_name).to.be.a('string');
        expect(dataModeled.speech_number).to.be.a('number');
        expect(dataModeled.line_number).to.be.a('string');
        expect(dataModeled.speaker).to.be.a('string');
        expect(dataModeled.test_object).to.be.a('object');
        done();
    });
});