import React, {useState } from 'react';
import { AppEvents, ArrayVector, GrafanaTheme, PanelProps } from '@grafana/data';
import { Button, getScrollbarWidth, HorizontalGroup, Modal, styleMixins, stylesFactory, useTheme  } from '@grafana/ui';
import { SystemJS } from '@grafana/runtime';
import { defaults } from 'lodash';
import { css } from 'emotion';
import * as mqtt from 'mqtt';

import { LibreOperatorOrderMgtTableOptions, Order } from 'types';

const { alertError, alertSuccess } = AppEvents;

const defaultOptions: Partial<mqtt.IClientOptions> = {
  keepalive: 30,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: false,
  reconnectPeriod: 0,
  connectTimeout: 30 * 1000,
  resubscribe: false,
  rejectUnauthorized: false
}

interface Props extends PanelProps<LibreOperatorOrderMgtTableOptions> {}

const COLUMNS: string[] = ['Line', 'Order', 'Prod. Id', 'Date', 'Status', 'QTY', 'Complete', 'Rate', 'Start Time', 'Prod. Description']

export const LibreOperatorOrderMgtTablePanel: React.FC<Props> = ({ options, data, width, height }) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const dashboardAlert = (type: any, msg: string ) => {
    SystemJS.load('app/core/app_events')
      .then((events: any) => {
        events.emit(type, [msg]);
      })
  }

  const onOrderClick = (event: any, order: Order) => {
    setSelectedOrder(order)
  }

  const dismissOrder = () => {
    setSelectedOrder(null)
  }

  const startOrder = () => {
    const mqttOptions: mqtt.IClientOptions = defaults({
      clientId: options.clientId,
      host: options.broker,
      path: options.basePath,
      port: options.port,
      protocol: options.secure ? 'wss' : 'ws',
    }, defaultOptions);
    let client: mqtt.MqttClient = mqtt.connect(`${options.secure ? 'wss' : 'ws'}://${options.broker}:${options.port}${options.basePath}`, mqttOptions)
    
    client.on('connect', () => {
      client.publish(
        `${(selectedOrder || {line: 'Unknown'}).line}/Order`,
        `${(selectedOrder || {order: ''}).order}`,
        {qos: 1, retain: true})
      setSelectedOrder(null)
      dashboardAlert(alertSuccess, `Order Started`);
    })

    client.on('error', (error: Error) => {
      console.error(error);
      dashboardAlert(alertError, `MQTT Error: ${error.message}`)
    })
  }

  const stopOrder = () => {
    const mqttOptions: mqtt.IClientOptions = defaults({
      clientId: options.clientId,
      host: options.broker,
      path: options.basePath,
      port: options.port,
      protocol: options.secure ? 'wss' : 'ws',
    }, defaultOptions);
    let client: mqtt.MqttClient = mqtt.connect(`${options.secure ? 'wss' : 'ws'}://${options.broker}:${options.port}${options.basePath}`, mqttOptions)
    
    client.on('connect', (cb) => {
      client.publish(
        `${(selectedOrder || {line: 'Unknown'}).line}/Order`,
        `${options.noOrder || ''}`,
        {qos: 1, retain: true})
        setSelectedOrder(null)
        dashboardAlert(alertSuccess, `Order Stopped`)
    })

    client.on('error', (error: Error) => {
      dashboardAlert(alertError, `MQTT Error: ${error.message}`)
    })
  }

  /**
   * Check data
   */
  
  // 1 Series
  if (data.series.length > 1) {
    const e = new Error("Expect only one series at most")
    throw(e);
  }

  // Marshall into "Order" type
  let orders: Order[] = [];
  if (data.series.length == 1) {

    let lineFields = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'line' || f.config.displayName?.toLowerCase() === 'line'}
    )[0].values
    let orderFields = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'order' || f.config.displayName?.toLowerCase() === 'order'}
    )[0].values
    let productFields = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'product' || f.config.displayName?.toLowerCase() === 'product'}
    )[0].values
    let scheduledStartTimeFields = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'scheduledstarttime' || f.config.displayName?.toLowerCase() === 'scheduledstarttime'}
    )[0].values
    let statusFields = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'status' || f.config.displayName?.toLowerCase() === 'status'}
    )[0].values
    let scheduleQuantityFields = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'scheduledquantity' || f.config.displayName?.toLowerCase() === 'scheduledquantity'}
    )[0].values
    const actualQuantityFieldsArray = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'actualquantity' || f.config.displayName?.toLowerCase() === 'actualquantity'}
    )
    let actualQuantityFields = actualQuantityFieldsArray.length > 0 ? actualQuantityFieldsArray[0].values : new ArrayVector()
    let rateFields = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'rate' || f.config.displayName?.toLowerCase() === 'rate'}
    )[0].values
    const actualStartTimeFieldArray = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'actualstarttime' || f.config.displayName?.toLowerCase() === 'actualstarttime'}
    )
    let actualStartTimeFields = actualStartTimeFieldArray.length > 0 ? actualStartTimeFieldArray[0].values : new ArrayVector()
    let productDescriptionFields = data.series[0].fields.filter(
      (f)=>{return f.name.toLowerCase() === 'productdescription' || f.config.displayName?.toLowerCase() === 'productdescription'}
    )[0].values


    for (let i = 0; i < data.series[0].fields[0].values.length; i++){
      // Map into order
      let newOrder: Order = {
        line: lineFields.get(i) as string,
        order: orderFields.get(i) as string,
        product: productFields.get(i) as string,
        scheduleStartTime: scheduledStartTimeFields.get(i) as number,
        status: statusFields.get(i) as string,
        scheduleQuantity: scheduleQuantityFields.get(i) as number,
        actualQuantity: actualQuantityFields.get(i) as number || undefined,
        rate: rateFields.get(i) as number,
        actualStartTime: actualStartTimeFields.get(i) as number || undefined,
        productDescription: productDescriptionFields.get(i) as string,
      }
      orders.push(newOrder);
    }
  }

  return (
    <div
      role="table"
      className={styles.wrapper}
    >
      <table width={width}>
        <thead className={styles.thead}>
          <tr >
            {COLUMNS.map((column)=> {
              return (<th className={styles.headerCell}>
                <div className={styles.headerCellLabel}>{column}</div>
              </th>)
            })}
          </tr>
        </thead>
        { selectedOrder 
          ? <Modal 
            isOpen={!!selectedOrder} 
            title={selectedOrder.order}
            onClickBackdrop={dismissOrder}
            onDismiss={dismissOrder}>
              <p>Use the buttons to start/and stop the order.</p>
              <HorizontalGroup spacing="lg">
                <Button icon="play" onClick={startOrder} disabled={selectedOrder.status != undefined && ['created', 'planned', 'ready'].indexOf(selectedOrder.status.toLocaleLowerCase()) < 0}>Start</Button>
                <Button icon="square-shape" onClick={stopOrder} disabled={selectedOrder.status != undefined && ['running'].indexOf(selectedOrder.status.toLocaleLowerCase()) < 0}>Stop</Button>
              </HorizontalGroup>
            </Modal>
          : <></> }
        <tbody>
          {orders &&
            orders.map((order) => {
              return (<>
                <tr
                  className={styles.row(order.status)}
                  onClick={(e) => {onOrderClick(e, order)}}
                >
                  <td className={styles.cellContainer(order.status)}>{order.line}</td>
                  <td className={styles.cellContainer(order.status)}>{order.order}</td>
                  <td className={styles.cellContainer(order.status)}>{order.product}</td>
                  <td className={styles.cellContainer(order.status)}>{order.scheduleStartTime}</td>
                  <td className={styles.cellContainer(order.status)}>{order.status}</td>
                  <td className={styles.cellContainer(order.status)}>{order.scheduleQuantity}</td>
                  <td className={styles.cellContainer(order.status)}>{order.actualQuantity}</td>
                  <td className={styles.cellContainer(order.status)}>{order.rate}</td>
                  <td className={styles.cellContainer(order.status)}>{order.actualStartTime}</td>
                  <td className={styles.cellContainer(order.status)}>{order.productDescription}</td>
                </tr>
              </>)
            })}
        </tbody>
      </table>
    </div>
  );
}

const getStatusColor = (status: string | undefined, theme?: string) => {
  if (status === undefined || status === null) {
    return '#FFFFFFFF'
  }

  switch (status.toLowerCase()) {
    case 'planned':
      return theme === 'light' ? '#C9C9C9': '#636363';
    case 'next':
      return theme === 'light' ? '#FFFB85': '#636112';
    case 'running':
      return theme === 'light' ? '#91F449': '#3B631E';
    case 'paused':
      return theme === 'light' ? '#E8B20C': '#634C05';
    case 'complete':
      return theme === 'light' ? '#70C6FF': '#2C4D63';
    case 'closed':
      return theme === 'light' ? '#FF7773': '#632F2D';
    case 'ready':
    default:
      return theme === 'light' ? '#CCFFAF': '#506345';
  }
}

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

  const buildCellContainerStyle = (status?: string) => {
    const background = getStatusColor(status, themeName)
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
        .cell-filter-actions  {
          display: inline-flex;
        }
      }
    `;
  };

  const buildRowStyle = (status?: string) => {
    const statusColour = getStatusColor(status, themeName)

    const rowHoverBg = styleMixins.hoverColor(statusColour || theme.colors.bg1, theme);
    return css`
      label: row;
      border-bottom: 1px solid ${borderColor};
      &:hover {
        background-color: ${rowHoverBg};
      }
    `
  }
  
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
      overflow-y: auto;
      overflow-x: hidden;
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
    row: buildRowStyle
  }
})