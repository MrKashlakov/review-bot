import service from '../../logger';
import { Writable } from 'stream';

class MyDummyWritableStream extends Writable {

  _write(chunk, encoding, callback) {
    callback();
  }

}

describe('services/logger', function () {

  it('should be resolved to Logger', function () {

    const options = {
      transports: []
    };

    const logger = service(options);

    assert.property(logger, 'log');
    assert.property(logger, 'info');
    assert.property(logger, 'warn');
    assert.property(logger, 'error');

  });

  describe('#options', function () {

    it('should accept `file` and `console` transports', function () {

      const options = {
        transports: [
          {
            name: 'file',
            stream: new MyDummyWritableStream()
          },
          {
            name: 'console',
            timestamp: true
          }
        ]
      };

      service(options);
    });

    it('should throw an error if unknown transport was given', function () {
      const options = {
        transports: [{ name: 'blackhole' }]
      };

      assert.throws(() => service(options), /blackhole/);
    });

  });

});
