'use strict';

System.register(['./utils', './postgres', './camunda'], function (_export, _context) {
	"use strict";

	var utils, postgres, camunda, _createClass, CompleteConfirmCtrl;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_utils) {
			utils = _utils;
		}, function (_postgres) {
			postgres = _postgres;
		}, function (_camunda) {
			camunda = _camunda;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			_export('CompleteConfirmCtrl', CompleteConfirmCtrl = function () {
				/** @ngInject */
				function CompleteConfirmCtrl(_ref) {
					var data = _ref.data,
					    tableCtrl = _ref.tableCtrl,
					    url = _ref.url,
					    line = _ref.line,
					    showAlerts = _ref.showAlerts;

					_classCallCheck(this, CompleteConfirmCtrl);

					this.init(data, tableCtrl, url, line, showAlerts);
					this.prepare();
				}

				_createClass(CompleteConfirmCtrl, [{
					key: 'init',
					value: function init(data, tableCtrl, url, line, showAlerts) {
						this.data = data;
						this.tableCtrl = tableCtrl;
						this.url = url;
						this.line = line;
						this.showAlerts = showAlerts;
					}
				}, {
					key: 'prepare',
					value: function prepare() {
						this.modalTitle = 'Confirm Required';
						this.confirmMsg = 'Are you sure you want to set this order to \'Complete\'? \n    Setting this to \'Complete\' will also CLOSE the Process Control Form related to this order';
					}
				}, {
					key: 'show',
					value: function show() {
						utils.showModal('confirm_form.html', this);
					}
				}, {
					key: 'closeProcessControlForm',
					value: function closeProcessControlForm(data) {
						postgres.getProductById(data.product_id, function (res) {
							if (res.length === 0) {
								utils.alert('error', 'Product Not Found', 'Camunda QA Check process initialisation failed because this Product CANNOT be found in the database, it may be because the product definition has been changed, but you can still start it Manually in Camunda BPM');
							} else {
								camunda.closeProcessControlForm(data.order_id);
							}
						});
					}
				}, {
					key: 'onConfirm',
					value: async function onConfirm() {
						var result = await utils.sure(utils.post(this.url, this.line));
						this.showAlerts(result, this.data.order_id, 'Complete');
						this.closeProcessControlForm(this.data);
						this.closeForm();
						this.tableCtrl.refresh();
					}
				}, {
					key: 'closeForm',
					value: function closeForm() {
						setTimeout(function () {
							document.querySelector('#op-mgt-confirm-modal-cancelBtn').click();
						}, 0);
					}
				}]);

				return CompleteConfirmCtrl;
			}());

			_export('CompleteConfirmCtrl', CompleteConfirmCtrl);
		}
	};
});
//# sourceMappingURL=confirm_modal_complete_ctrl.js.map
