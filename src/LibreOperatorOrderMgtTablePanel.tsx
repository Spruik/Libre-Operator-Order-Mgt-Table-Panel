import React, { Component } from 'react';
import { PanelProps, ArrayVector } from '@grafana/data';
import { LibreOperatorOrderMgtTableOptions, Order } from 'types';
import { css, cx } from 'emotion';
import { Alert, stylesFactory, Modal, Button, HorizontalGroup, Icon } from '@grafana/ui';
import * as mqtt from 'mqtt';

interface Props extends PanelProps<LibreOperatorOrderMgtTableOptions> {}

interface State {
  selectedOrder: Order | null;
  success: string | null;
  error: string | null;
}

const COLUMNS: string[] = ['Line', 'Order', 'Prod. Id', 'Date', 'Status', 'QTY', 'Complete', 'Rate', 'Start Time', 'Prod. Description']

export class LibreOperatorOrderMgtTablePanel extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      selectedOrder: null,
      success: null,
      error: null,
    }
  }

  getStyles = stylesFactory(() => {
    return {
      wrapper: css`
        position: relative;
      `,
      svg: css`
        position: absolute;
        top: 0;
        left: 0;
      `,
      textBox: css`
        position: absolute;
        bottom: 0;
        left: 0;
        padding: 10px;
      
      tr: {
        &:hover {
          border-color: aqua;
          border-width: 2px;
        }
      }`
    };
  });

  statusColours = (status: string) => {
    if (status === undefined || status === null) {
      return '#FFFFFFFF'
    }

    switch (status.toLowerCase()) {
      case 'planned':
        return '#C9C9C9';
      case 'next':
        return '#FFFB85'
      case 'running':
        return '#91F449'
      case 'paused':
        return '#E8B20C'
      case 'complete':
        return '#70C6FF'
      case 'closed':
        return '#FF7773'
      case 'ready':
      default:
        return '#CCFFAF';
    }
  }

  onOrderClick = (event: any, order: Order) => {
    this.setState({selectedOrder: order})
  }

  dismissOrder = () => {
    this.setState({selectedOrder: null})
  }

  startOrder = () => {
    const options: mqtt.IClientOptions = {
      port: 8084,
      host: 'test.libremfg.ai',
      hostname: 'test.libremfg.ai',
      path: '/mqtt',
      clientId: 'some-client',
      protocolId: 'MQTT',
      clean: true,
      reconnectPeriod: 0,
      connectTimeout: 30 * 1000,
      resubscribe: false,
      rejectUnauthorized: false,
      will: {
        topic: 'WillMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 0,
        retain: false
      },
    };
    //const brokerUrl = `${this.props.options.secure ? 'wss' : 'tcp'}://${this.props.options.broker}:${this.props.options.port}${this.props.options.basePath}`
    const brokerUrl = 'wss://test.libremfg.ai:8084/mqtt'
    let client: mqtt.MqttClient = mqtt.connect(brokerUrl, options)
    
    client.on('connect', (packet: mqtt.Packet) => {
      console.log("MQTT Client Connected")
      client.publish(
        `${(this.state.selectedOrder || {line: 'Unknown'}).line}/Order`,
        `${(this.state.selectedOrder || {order: ''}).order}`,
        {qos: 1, retain: true})
      console.log("MQTT Client Msg Published")
      client.end()
      console.log("MQTT Client Disconnected")
      this.setState({selectedOrder: null, success: "Order Started"})
      setTimeout(() => {
        this.dismissAlerts()
      }, 3000)
    })

    client.on('error', (error: Error) => {
      console.log(error);
      this.setState({selectedOrder: null, error: error.message})
      setTimeout(() => {
        this.dismissAlerts()
      }, 3000)
    })
  }

  stopOrder = () => {
    const options: mqtt.IClientOptions = {
      clientId: this.props.options.clientId,
      host: this.props.options.broker,
      path: this.props.options.basePath,
      port: this.props.options.port,
      keepalive: 30,
      protocol: this.props.options.secure ? 'wss' : 'mqtt',
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: 'WillMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 0,
        retain: false
      },
      rejectUnauthorized: false
    };
    let client: mqtt.MqttClient = mqtt.connect(`${this.props.options.secure ? 'wss' : 'ws'}://${this.props.options.broker}:${this.props.options.port}${this.props.options.basePath}`, options)
    
    client.on('connect', (cb) => {
      console.log("MQTT Client Connected")
      client.publish(
        `${(this.state.selectedOrder || {line: 'Unknown'}).line}/Order`,
        `${this.props.options.noOrder || ''}`,
        {qos: 1, retain: true})
      console.log("MQTT Client Msg Published")
      client.end()
      console.log("MQTT Client Disconnected")
      this.setState({selectedOrder: null, success: "Order Stopped"})
      setTimeout(() => {
        this.dismissAlerts()
      }, 3000)
    })

    client.on('error', (error: Error) => {
      console.log(error);
      this.setState({selectedOrder: null, error: error.message})
      setTimeout(() => {
        this.dismissAlerts()
      }, 3000)
    })
  }

  dismissAlerts = () => {
    this.setState({success: null, error: null})
  }

  render (){
    const { data, height, width } = this.props;
    const { selectedOrder, success, error } = this.state;

    const styles = this.getStyles();

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
        className={cx(
          styles.wrapper,
          css`
            width: ${width}px;
            height: ${height}px;
          `
        )}
      > { success
          ? <Alert 
            title={success}
            severity="success"
            onButtonClick={this.dismissAlerts}
            buttonContent={
              () => { 
                return (
                  <Icon name={"times"}/>
                )
              }
            }/>
          : <></>
        }
        { error
          ? <Alert
            title={error}
            severity="error"
            onButtonClick={this.dismissAlerts}
            buttonContent={
              () => { 
                return (
                  <Icon name={"times"}/>
                )
              }
            }/>
          : <></>
        }
        <table width={width}>
          <thead>
            {COLUMNS.map((column)=> {
              return (<th>{column}</th>)
            })}
          </thead>
          { selectedOrder 
            ? <Modal 
              isOpen={!!selectedOrder} 
              title={selectedOrder.order}
              onClickBackdrop={this.dismissOrder}
              onDismiss={this.dismissOrder}>
                <p>Use the buttons to start/and stop the order.</p>
                <HorizontalGroup spacing="lg">
                  <Button icon="play" onClick={this.startOrder} disabled={selectedOrder.status != undefined && ['created', 'planned', 'ready'].indexOf(selectedOrder.status.toLocaleLowerCase()) < 0}>Start</Button>
                  <Button icon="square-shape" onClick={this.stopOrder} disabled={selectedOrder.status != undefined && ['running'].indexOf(selectedOrder.status.toLocaleLowerCase()) < 0}>Stop</Button>
                </HorizontalGroup>
              </Modal>
            : <></> }
          <tbody>
            {orders &&
              orders.map((order) => {
                return (<>
                  <tr
                    onClick={(e) => {this.onOrderClick(e, order)}}
                    className={cx(
                      styles.wrapper,
                      css`
                        ${order.status ? 'background-color: ' + this.statusColours(order.status) + ' color: #000000': ''};
                      `
                    )}
                  >
                    <td>{order.line}</td>
                    <td>{order.order}</td>
                    <td>{order.product}</td>
                    <td>{order.scheduleStartTime}</td>
                    <td>{order.status}</td>
                    <td>{order.scheduleQuantity}</td>
                    <td>{order.actualQuantity}</td>
                    <td>{order.rate}</td>
                    <td>{order.actualStartTime}</td>
                    <td>{order.productDescription}</td>
                  </tr>
                </>)
              })}
          </tbody>
        </table>
      </div>
    );
  };
}