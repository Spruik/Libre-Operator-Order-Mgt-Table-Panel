'use strict';

System.register(['./utils'], function (_export, _context) {
  "use strict";

  var utils, getProductById;
  return {
    setters: [function (_utils) {
      utils = _utils;
    }],
    execute: function () {
      _export('getProductById', getProductById = function getProductById(id, success) {
        var url = utils.postgRestHost + 'product?id=eq.' + id;
        utils.get(url).then(function (res) {
          success(res);
        }).catch(function (e) {
          utils.alert('error', 'Connection Error', 'Camunda QA Check Process failed to start due to ' + e + ' but you can still start it manually');
        });
      });

      _export('getProductById', getProductById);
    }
  };
});
//# sourceMappingURL=postgres.js.map
