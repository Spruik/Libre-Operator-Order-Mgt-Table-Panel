'use strict';

System.register(['./utils'], function (_export, _context) {
  "use strict";

  var utils, restructure, post, startQACheck;
  return {
    setters: [function (_utils) {
      utils = _utils;
    }],
    execute: function () {
      restructure = function restructure(p) {

        p.ingredient.applicators.forEach(function (app) {
          delete app.$$hashKey;
          app.materials.forEach(function (mat) {
            delete mat.$$hashKey;
            delete mat.gramsTotal;
            delete mat.materialId;
            delete mat.oz;
            delete mat.seriseId;
            mat.formulaWt = mat.gramsOnScale;
            delete mat.gramsOnScale;
            mat.actualAvg = null;
            mat.actualDiff = null;
            mat.actualWt = null;
          });
        });

        var check = {
          productId: p.product_id,
          productDescription: p.product_desc,
          ingredient: {
            crust: {
              name: p.ingredient.crust.name,
              formulaWt: p.ingredient.crust.gramsOnScale,
              actualWt: null,
              actualAvg: null,
              actualDiff: null,
              tolerance: p.ingredient.crust.tolerance
            },
            sauce: {
              name: p.ingredient.sauce.name,
              formulaWt: p.ingredient.sauce.gramsOnScale,
              actualWt: null,
              actualAvg: null,
              actualDiff: null,
              tolerance: p.ingredient.sauce.tolerance
            },
            applicators: p.ingredient.applicators
          },
          meta: {
            isManual: false,
            checkCount: 1,
            isLastCheck: false,
            rangeMetrix: {}
          },
          conditionOfBelts: 'Good',
          beltDescription: null
        };

        return check;
      };

      post = function post(url, param, json) {
        return new Promise(function (resolve, reject) {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', url + param);
          xhr.onreadystatechange = handleResponse;
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.onerror = function (e) {
            return reject(e);
          };
          xhr.send(json);

          function handleResponse() {
            if (xhr.readyState === 4) {
              if (xhr.status < 300 && xhr.status >= 200) {
                resolve(xhr.responseText);
              } else {
                reject(xhr.responseText);
              }
            }
          }
        });
      };

      _export('startQACheck', startQACheck = function startQACheck(product, line) {
        var FORM_KEY = 'QAFormProductOnly';
        var PATH = 'process-definition/key/' + FORM_KEY + '/start';

        var p = restructure(product);

        var toSend = {
          variables: {
            _currentLine: { value: line, type: "String" },
            _currentCheck: { value: 1, type: "Long" },
            _lastCheck: { value: false, type: "Boolean" },
            _product: { value: JSON.stringify(p), type: "json" },
            _allChecks: { value: "[]", type: "json" }
          },
          businessKey: null
        };

        post(utils.camundaRestApi, PATH, JSON.stringify(toSend)).then(function (res) {
          utils.alert('success', 'Successful', 'A Camunda QA Check Process has been started');
        }).catch(function (e) {
          utils.alert('error', 'Connection Error', 'Camunda QA Check Process failed to start due to ' + e + ' but you can still start it manually');
        });
      });

      _export('startQACheck', startQACheck);
    }
  };
});
//# sourceMappingURL=camunda.js.map
