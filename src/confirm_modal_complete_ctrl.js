import * as utils from './utils';
import * as postgres from './postgres';
import * as camunda from './camunda';

export class CompleteConfirmCtrl {
	/** @ngInject */
	constructor({ data, tableCtrl, url, line, showAlerts }) {
		this.init(data, tableCtrl, url, line, showAlerts);
		this.prepare();
	}

	init(data, tableCtrl, url, line, showAlerts) {
		this.data = data;
		this.tableCtrl = tableCtrl;
		this.url = url;
		this.line = line;
		this.showAlerts = showAlerts;
	}

	prepare() {
		this.modalTitle = `Confirm Required`;
		this.confirmMsg = `Are you sure you want to set this order to 'Complete'? 
    Setting this to 'Complete' will also CLOSE the Process Control Form related to this order`;
	}

	show() {
		utils.showModal('confirm_form.html', this);
	}

	closeProcessControlForm(data) {
		postgres.getProductById(data.product_id, (res) => {
			if (res.length === 0) {
				utils.alert(
					'error',
					'Product Not Found',
					'Camunda QA Check process initialisation failed because this Product CANNOT be found in the database, it may be because the product definition has been changed, but you can still start it Manually in Camunda BPM'
				);
			} else {
				camunda.closeProcessControlForm(data.order_id);
			}
		});
	}

	async onConfirm() {
		const result = await utils.sure(utils.post(this.url, this.line));
		this.showAlerts(result, this.data.order_id, 'Complete');
		this.closeProcessControlForm(this.data);
		this.closeForm();
		this.tableCtrl.refresh();
	}

	closeForm() {
		setTimeout(() => {
			document.querySelector('#op-mgt-confirm-modal-cancelBtn').click();
		}, 0);
	}
}
