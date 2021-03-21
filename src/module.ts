import { PanelPlugin } from '@grafana/data';
import { LibreOperatorOrderMgtTableOptions } from './types';
import { LibreOperatorOrderMgtTablePanel } from './LibreOperatorOrderMgtTablePanel';

export const plugin = new PanelPlugin<LibreOperatorOrderMgtTableOptions>(LibreOperatorOrderMgtTablePanel).setPanelOptions(builder => {
  return builder
    .addTextInput({
      path: 'broker',
      name: 'MQTT Broker',
      description: 'Address of the MQTT Broker to write Order Changes to',
      defaultValue: 'localhost',
    })
    .addNumberInput({
      path: 'port',
      name: 'Port',
      description: 'MQTT Broker Connection Port',
      defaultValue: 1883
    })
    .addTextInput({
      path: 'clientId',
      name: 'Client Id',
      description: 'Name of the client id to connect with',
      defaultValue: `mqttjs_${Math.random().toString(16).substr(2, 8)}`,
    })
    // .addBooleanSwitch({
    //   path: 'showSeriesCount',
    //   name: 'Show series counter',
    //   defaultValue: false,
    // })
    // .addRadio({
    //   path: 'seriesCountSize',
    //   defaultValue: 'sm',
    //   name: 'Series counter size',
    //   settings: {
    //     options: [
    //       {
    //         value: 'sm',
    //         label: 'Small',
    //       },
    //       {
    //         value: 'md',
    //         label: 'Medium',
    //       },
    //       {
    //         value: 'lg',
    //         label: 'Large',
    //       },
    //     ],
    //   },
    // showIf: config => config.showSeriesCount,
    // });
});
