'use strict';

System.register(['app/core/core', './utils', './table_ctrl', './postgres', './camunda', 'moment'], function (_export, _context) {
  "use strict";

  var appEvents, get, influxHost, post, alert, tableCtrl, postgres, camunda, utils, moment, rowData, runningRecord, closeForm;


  function showActionForm(productionLine, orderId, description, productId) {
    var tags = {
      productionLine: productionLine,
      orderId: orderId,
      description: description,
      productId: productId
    };

    getRowData(callback, tags);

    function callback() {
      if (rowData.order_state) {
        if (rowData.order_state.toLowerCase() === 'planned') {
          alert('warning', 'Warning', 'This order has NOT been released');
          return;
        }
        if (rowData.order_state.toLowerCase() === 'closed') {
          alert('warning', 'Warning', 'This order has been closed');
          return;
        }
      }

      appEvents.emit('show-modal', {
        src: 'public/plugins/smart-factory-operator-order-mgt-table-panel/partials/actions_form.html',
        modalClass: 'confirm-modal',
        model: { orderId: tags.orderId }
      });

      removeListeners();
      addListeners();
    }
  }

  /**
   * Get the record data with the tag values passed in
   * Call the callback function once it is finished
   * Stop and prompt error when it fails
   * @param {*} callback 
   * @param {*} tags 
   */
  function getRowData(callback, tags) {
    var url = getInfluxLine(tags);
    get(url).then(function (res) {
      var result = formatData(res, tags);
      rowData = result[0];
      runningRecord = result[1];
      callback();
    }).catch(function (e) {
      alert('error', 'Database Error', 'Database connection failed with influxdb');
      console.log(e);
    });
  }

  /**
   * Write line for the influxdb query
   * @param {*} tags 
   */
  function getInfluxLine(tags) {
    var url = influxHost + 'query?pretty=true&db=smart_factory&q=select last(*) from OrderPerformance' + ' where ';
    url += 'production_line=' + '\'' + tags.productionLine + '\'' + ' group by ' + '"product_desc", "product_id", "order_id"';

    // console.log(url)

    return url;
  }

  /**
   * The params may contain more than one row record
   * This is to fomrat the http response into a better structure
   * And also filter out the latest record
   * @param {*} res 
   */
  function formatData(res, tags) {
    var records = [];

    var series = res.results[0].series;

    // console.log(res)

    var cols = series[0].columns;
    cols = cols.map(function (x) {
      return x.substring(5, x.length);
    });
    cols[0] = "time";
    var rows = [];
    var resultTags = [];
    for (var i = 0; i < series.length; i++) {
      rows.push(series[i].values[0]);
      resultTags.push(series[i].tags);
    }

    for (var _i = 0; _i < rows.length; _i++) {
      var row = rows[_i];
      var obj = {};
      for (var k = 0; k < cols.length; k++) {
        var col = cols[k];
        obj[col] = row[k];
      }
      obj = Object.assign(obj, resultTags[_i]);
      records.push(obj);
    }

    var currents = records.filter(function (record) {
      return record.order_id === tags.orderId && record.product_id === tags.productId && record.product_desc === tags.description;
    });
    var current = currents[currents.length - 1];

    // console.log(current)

    //find the latest running record
    var runnings = records.filter(function (record) {
      return record.order_state.toLowerCase() === 'running';
    });
    var filteredRunnings = runnings.filter(function (running) {
      return running.order_id !== tags.orderId || running.product_id !== tags.productId;
    });
    var running = filteredRunnings[filteredRunnings.length - 1];

    //If the records of that line is new, there might be no 'running' at all, return!
    if (running === null || running === undefined) {
      return [current, null];
    }

    //check if the latest running record is the latest record in it's own group
    //becuase there is possibility that the record is set to paused, so the latest running record is not the latest record for that group
    var runningGroups = records.filter(function (record) {
      return record.order_id === running.order_id && record.product_id === running.product_id && record.product_desc === running.product_desc;
    });
    var isRunningTheLatest = _.isEqual(running, runningGroups[runningGroups.length - 1]);
    if (!isRunningTheLatest) {
      running = null;
    }

    // console.log(records)
    // console.log('cur',current);
    // console.log('runn',running)
    return [current, running];
  }

  /**
   * Add listener for the action selection
   * If edit clicked, go to the edit form with the current record data
   * If realease clicked, change record status to 'Ready'
   * If delete clicked, change record status to 'Deleted'
   */
  function addListeners() {
    $(document).on('click', 'input[type="button"][name="order-mgt-operator-actions-radio"]', function (e) {

      if (e.target.id === 'flag') {
        if (rowData.order_state.toLowerCase() === 'ready' || rowData.order_state.toLowerCase() === 'paused') {
          updateRecord(rowData, 'Next', 0);
        } else {
          alert('warning', 'Warning', 'Only orders in Ready or Paused state can be flagged');
        }
      } else if (e.target.id === 'start') {
        if (rowData.order_state.toLowerCase() === 'next') {
          if (runningRecord) {
            updateNextToRunningAndRunningExist(rowData, runningRecord, rowData.planned_rate);
            postgres.getProductById(rowData.product_id, function (res) {
              if (res.length === 0) {
                utils.alert('error', 'Product Not Found', 'Camunda QA Check process initialisation failed because this Product CANNOT be found in the database, it may be because the product definition has been changed, but you can still start it Manually in Camunda BPM');
              } else {
                camunda.startQACheck(res[0], rowData.production_line);
              }
            });
          } else {
            updateRecord(rowData, 'Running', rowData.planned_rate);
            postgres.getProductById(rowData.product_id, function (res) {
              if (res.length === 0) {
                utils.alert('error', 'Product Not Found', 'Camunda QA Check process initialisation failed because this Product CANNOT be found in the database, it may be because the product definition has been changed, but you can still start it Manually in Camunda BPM');
              } else {
                camunda.startQACheck(res[0], rowData.production_line);
              }
            });
          }
        } else {
          alert('warning', 'Warning', 'Only orders in Next state can be started');
        }
      } else if (e.target.id === 'pause') {
        if (rowData.order_state.toLowerCase() === 'running') {
          updateRecord(rowData, 'Paused', 0);
        } else {
          alert('warning', 'Warning', 'Only orders in Running state can be paused');
        }
      } else if (e.target.id === 'complete') {
        if (rowData.order_state.toLowerCase() === 'running' || rowData.order_state.toLowerCase() === 'paused') {
          updateRecord(rowData, 'Complete', 0);
        } else {
          alert('warning', 'Warning', 'Only orders in Running or Paused state can be complete');
        }
      } else if (e.target.id === 'close') {
        if (rowData.order_state.toLowerCase() === 'complete') {
          updateRecord(rowData, 'Closed', 0);
        } else {
          alert('warning', 'Warning', 'Only orders in Complete state can be closed');
        }
      }
    });
  }

  function removeListeners() {
    $(document).off('click', 'input[type="button"][name="order-mgt-operator-actions-radio"]');
  }

  function updateRecord(data, status, rate) {
    var line = writeInfluxLine(data, status, rate);
    var url = influxHost + 'write?db=smart_factory';
    post(url, line).then(function (res) {
      alert('success', 'Success', 'Order ' + rowData.order_id + ' has been marked as ' + status);
      closeForm();
      tableCtrl.refresh();
    }).catch(function (e) {
      alert('error', 'Error', 'An error occurred while updating the database, please check your database connection');
      closeForm();
      console.log(e);
    });
  }

  function updateNextToRunningAndRunningExist(cur, run, rate) {
    var currentLine = writeInfluxLine(cur, 'Running', rate);
    var runningLine = writeInfluxLine(run, 'Complete', 0);
    var url = influxHost + 'write?db=smart_factory';
    post(url, runningLine).then(post(url, currentLine).then(function (res) {
      alert('success', 'Success', 'Order ' + cur.order_id + ' has been marked as Running');
      closeForm();
      tableCtrl.refresh();
    })).catch(function (e) {
      alert('error', 'Error', 'An error occurred while updating the database, please check your database connection');
      closeForm();
      console.log(e);
    });
  }

  /**
   * Expect the status string (Normally are: 'Ready' or 'Deleted')
   * Then changed the status in the line with anything else unchanged
   * @param {*} status 
   */
  function writeInfluxLine(data, status, rate) {
    //For influxdb tag keys, must add a forward slash \ before each space 
    var product_desc = data.product_desc.split(' ').join('\\ ');

    var line = 'OrderPerformance,order_id=' + data.order_id + ',product_id=' + data.product_id + ',product_desc=' + product_desc + ' ';

    if (data.compl_qty !== null && data.compl_qty !== undefined) {
      line += 'compl_qty=' + data.compl_qty + ',';
    }
    if (data.machine_state !== null && data.machine_state !== undefined) {
      line += 'machine_state="' + data.machine_state + '"' + ',';
    }
    if (data.scrap_qty !== null && data.scrap_qty !== undefined) {
      line += 'scrap_qty=' + data.scrap_qty + ',';
    }
    if (data.actual_start_datetime !== null && data.actual_start_datetime !== undefined) {
      line += 'actual_start_datetime=' + data.actual_start_datetime + ',';
    }
    if (data.actual_end_datetime !== null && data.actual_end_datetime !== undefined) {
      line += 'actual_end_datetime=' + data.actual_end_datetime + ',';
    }

    if (status === 'Running') {
      //set actual start time = now
      line += 'actual_start_datetime=' + moment.now() + ',';
    } else if (status === 'Complete') {
      //set actual end time = now
      line += 'actual_end_datetime=' + moment.now() + ',';
    }

    line += 'order_state="' + status + '"' + ',';
    line += 'order_date="' + data.order_date + '"' + ',';
    line += 'production_line="' + data.production_line + '"' + ',';
    line += 'order_qty=' + data.order_qty + ',';
    line += 'scheduled_end_datetime=' + data.scheduled_end_datetime + ',';
    line += 'scheduled_start_datetime=' + data.scheduled_start_datetime + ',';
    line += 'planned_changeover_time="' + data.planned_changeover_time + '"' + ',';
    line += 'setpoint_rate=' + rate + ',';
    line += 'planned_rate=' + data.planned_rate;

    // console.log(line);
    return line;
  }

  return {
    setters: [function (_appCoreCore) {
      appEvents = _appCoreCore.appEvents;
    }, function (_utils) {
      get = _utils.get;
      influxHost = _utils.influxHost;
      post = _utils.post;
      alert = _utils.alert;
      utils = _utils;
    }, function (_table_ctrl) {
      tableCtrl = _table_ctrl;
    }, function (_postgres) {
      postgres = _postgres;
    }, function (_camunda) {
      camunda = _camunda;
    }, function (_moment) {
      moment = _moment.default;
    }],
    execute: function () {
      rowData = void 0;
      runningRecord = {};

      closeForm = function closeForm() {
        $('#order-mgt-operator-action-form-dismiss-btn').trigger('click');
      };

      _export('showActionForm', showActionForm);
    }
  };
});
//# sourceMappingURL=actions_form_ctrl.js.map
