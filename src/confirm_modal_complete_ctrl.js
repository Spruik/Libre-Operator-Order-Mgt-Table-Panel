import * as utils from './utils'
import * as postgres from './postgres'
export class CompleteConfirmCtrl {
  /** @ngInject */
  constructor ({ data, tableCtrl, url, line, showAlerts }) {
    this.init(data, tableCtrl, url, line, showAlerts)
    this.prepare()
  }

  init (data, tableCtrl, url, line, showAlerts) {
    this.data = data
    this.tableCtrl = tableCtrl
    this.url = url
    this.line = line
    this.showAlerts = showAlerts
  }

  prepare () {
    this.showConfirmBtn = true
    this.modalTitle = 'Confirm Required'
    this.confirmMsg = `Are you sure you want to set this order to 'Complete'? 
    Setting this to 'Complete' will also CLOSE the Process Control Form related to this order`
  }

  show () {
    utils.showModal('confirm_form.html', this)
  }

  closeProcessControlForm (data) {
    this.closeForm()
    const f = async () => {
      const result = await utils.sure(utils.post(this.url, this.line))
      this.showAlerts(result, this.data.order_id, 'Complete')
      this.tableCtrl.refresh()
    }
    f()
  }

  showLoading () {
    this.modalTitle = 'Closing Process Control Form'
    this.confirmMsg = 'The process control form is now being closed, please wait ...'
    this.showConfirmBtn = false
    utils.showModal('confirm_form.html', this)
  }

  closeLoading () {
    setTimeout(() => {
      document.querySelector('#op-mgt-confirm-modal-cancelBtn').click()
    }, 0)
  }

  onConfirm () {
    this.closeProcessControlForm(this.data)
  }

  closeForm () {
    setTimeout(() => {
      document.querySelector('#op-mgt-confirm-modal-cancelBtn').click()
    }, 0)
  }
}
