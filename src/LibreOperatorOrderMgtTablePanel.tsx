import React, { useState } from 'react';
import { AppEvents, DataFrame, GrafanaTheme, PanelData, PanelProps } from '@grafana/data';
import { Button, getScrollbarWidth, HorizontalGroup, Modal, styleMixins, stylesFactory, useTheme } from '@grafana/ui';
import { getDataSourceSrv, SystemJS } from '@grafana/runtime';
import { css } from 'emotion';

import { LibreOperatorOrderMgtTableOptions, Order } from 'types';


const { alertError, alertSuccess } = AppEvents;

interface Props extends PanelProps<LibreOperatorOrderMgtTableOptions> {}

const transform = (data: PanelData) => {
    return transformJobRequests(data)
}

const getColumnNames = (data: PanelData) =>{
  const fields = data.series[0].fields;
  return fields.map(field => field.name)
}

const transformDispatch = (dataPanel: PanelData) =>{
  console.log(dataPanel.series);
}

const transformJobRequests = (dataPanel: PanelData) =>{
    const dataFields = getColumnNames(dataPanel);
    const dataFrame = dataPanel.series[0]

    if (!dataFrame) {
      return [];
    }
    let jobOrders = []

    
    let dataFieldValues = {};

    for (let fieldName of dataFields){
      
      //@ts-ignore
      dataFieldValues[fieldName] =  dataFrame.fields.find(field => {return field.name === fieldName})
    }

    for (let i = 0; i < dataFrame.length; i++){
      let jobOrder = {};
      for (let fieldName of dataFields){
        //@ts-ignore
        jobOrder[fieldName] = dataFieldValues[fieldName]?.values.get(i);
      }
      jobOrders.push(jobOrder);
    }

    return {fields: dataFields,requests: jobOrders};

  }

  const refreshDashboard = () => {
    //
    // TODO: This is such a hack and needs to be replaced with something better
    // Source: https://community.grafana.com/t/refresh-the-dashboard-from-the-react-panel-plugin/31255/7
    //
    const refreshPicker = document.getElementsByClassName('refresh-picker');
    if (refreshPicker.length > 0) {
      const buttons = refreshPicker[0].getElementsByClassName('toolbar-button');
      if (buttons.length > 0) {
        const button = buttons[0];
        // @ts-ignore
        button.click();
      }
    }
  };
    

export const LibreOperatorOrderMgtTablePanel: React.FC<Props> = ({ options, data, width, height }) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
 
  const executeMutation = (request: string) => {

    console.log(request)

    const eventsRequest = data.request?.targets.find(target => {
      return target.refId === options.eventMetric;
    });

    if (eventsRequest) {
      getDataSourceSrv()
        .get(eventsRequest.datasource)
        .then(ds => {
          try {
            //@ts-ignore
            ds.request(request).then((payload: ResponseWithData) => {
              if (payload?.status === 200) {
                if (payload.data.errors !== undefined) {
                  //@ts-ignore
                  dashboardAlert(alertError, `EVENT UPDATE FAILED: ${payload.data.errors[0].message}`);
                } else {
                  dashboardAlert(alertSuccess, `Event Successfully Updated`);
                  refreshDashboard();
                  dismissOrder();
                }
              }
            });
          } catch (error) {
            dashboardAlert(alertError, `Failed to Update: ${error}`);
          }
        })
        .catch((err: Error) => {
          dashboardAlert(alertError, `Failed to find Event Metric '${options.eventMetric}': ${err}`);
        });
    } else {
      dashboardAlert(alertError, `Failed to find Event Metric '${options.eventMetric}'`);
    }
  };

  const updateJobStatus = (jobName: string, status: string) =>{

    const query = `mutation{
      updateJobOrderStatus(input:{filter:{name:{eq:"${jobName}"}},set:{dispatchStatus:${status}}}){
        equipment{
          id
        }
      }
    }`

    executeMutation(query);
  }

  //@ts-ignore
  const dashboardAlert = (type: any, msg: string) => {
    SystemJS.load('app/core/app_events').then((events: any) => {
      events.emit(type, [msg]);
    });
  };

  

  const startOrder = (e: any) => {
    console.log(selectedOrder)
    updateJobStatus(selectedOrder.name, "ACTIVE" )
  };

  const stopOrder = (e: any) => {
    
  };

  const onOrderClick = (event: any, order: Order) => {
    setSelectedOrder(order);
  };

  const dismissOrder = () => {
    setSelectedOrder(null);
  };

  //@ts-ignore
  const orders = transform(data).requests;
  //@ts-ignore
  const columns = transform(data).fields;

  const transitions = transformDispatch(data);

  return (
    <div role="table" className={styles.wrapper}>
      <table width={width}>
        <thead className={styles.thead}>
          <tr>
            {columns.map(column => {
              return (
                <th className={styles.headerCell}>
                  <div className={styles.headerCellLabel}>{column}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        {selectedOrder ? (
          <Modal
            isOpen={!!selectedOrder}
            title={selectedOrder.order}
            onClickBackdrop={dismissOrder}
            onDismiss={dismissOrder}
          >
            <p>Use the buttons to start/and stop the order.</p>
            <HorizontalGroup spacing="lg">
              <Button
                icon="play"
                onClick={startOrder}
                disabled={
                  selectedOrder.status !== undefined &&
                  ['created', 'planned', 'ready'].indexOf(selectedOrder.status.toLocaleLowerCase()) < 0
                }
              >
                Start
              </Button>
              <Button
                icon="square-shape"
                onClick={stopOrder}
                disabled={
                  selectedOrder.status !== undefined &&
                  ['running'].indexOf(selectedOrder.status.toLocaleLowerCase()) < 0
                }
              >
                Stop
              </Button>
            </HorizontalGroup>
          </Modal>
        ) : (
          <></>
        )}
        <tbody>
          {orders &&
            orders.map(order => {
              return (
                <tr className={styles.row(theme, options, order.dispatchStatus)} onClick={(e) => {onOrderClick(e, order)}}>
                  {
                    columns.map(column => {
                      return <td className={styles.cellContainer(theme, options, order.dispatchStatus)}> {order[column]} </td>
                    })
                  }
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

const getStatusColor = (theme: any, options: any, status: string | undefined) => {
  if (status === undefined || status === null) {
    return '#FFFFFFFF';
  }

  switch (status.toLowerCase()) {
    case 'active':
      return theme.visualization.getColorByName(options.active);
    case 'next':
      return theme.visualization.getColorByName(options.parked);
    case 'running':
      return theme.visualization.getColorByName(options.parked);
    case 'paused':
      return theme.visualization.getColorByName(options.parked);
    case 'complete':
      return theme.visualization.getColorByName(options.parked);
    case 'pending':
      return theme.visualization.getColorByName(options.pending);
    case 'ready':
    default:
      return theme === 'light' ? '#CCFFAF' : '#506345';
  }
};

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  const headerBg = theme.colors.bg2;
  const borderColor = theme.colors.border1;
  const cellPadding = 6;
  const lineHeight = theme.typography.lineHeight.md;
  const bodyFontSize = 14;
  const cellHeight = cellPadding * 2 + bodyFontSize * lineHeight;
  const rowHoverBg = styleMixins.hoverColor(theme.colors.bg1, theme);
  const lastChildExtraPadding = Math.max(getScrollbarWidth(), cellPadding);
  const themeName = theme.type;

  const buildCellContainerStyle = (theme,options, status?: string) => {
    const background = getStatusColor(theme,options,status);
    return css`
      padding: ${cellPadding}px;

      align-items: center;
      border-right: 1px solid ${borderColor};

      ${background ? `background: ${background};` : ''};
      &:last-child {
        border-right: none;
        padding-right: ${lastChildExtraPadding}px;
      }
      &:hover {
        overflow: visible;
        width: auto !important;
        box-shadow: 0 0 2px ${theme.colors.formFocusOutline};
        background: ${background ?? rowHoverBg};
        z-index: 1;
        .cell-filter-actions {
          display: inline-flex;
        }
      }
    `;
  };

  const buildRowStyle = (theme, options, status?: string) => {
    const statusColour = getStatusColor(theme, options, status);

    const rowHoverBg = styleMixins.hoverColor(statusColour || theme.colors.bg1, theme);
    return css`
      label: row;
      border-bottom: 1px solid ${borderColor};
      &:hover {
        background-color: ${rowHoverBg};
      }
    `;
  };

  return {
    wrapper: css`
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    `,
    thead: css`
      label: thead;
      height: ${cellHeight}px;
      overflow-y: scroll;
      overflow-x: scroll;
      background: ${headerBg};
      position: relative;
    `,
    headerCell: css`
      padding: ${cellPadding}px;
      overflow: hidden;
      white-space: nowrap;
      color: ${theme.colors.textBlue};
      border-right: 1px solid ${theme.colors.panelBg};
      &:last-child {
        border-right: none;
      }
    `,
    headerCellLabel: css`
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      margin-right: ${theme.spacing.xs};
    `,
    cellContainer: buildCellContainerStyle,
    row: buildRowStyle,
  };
});
