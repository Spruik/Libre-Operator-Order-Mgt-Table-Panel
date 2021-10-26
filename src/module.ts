import { PanelPlugin } from '@grafana/data';
import { LibreOperatorOrderMgtTableOptions } from './types';
import { LibreOperatorOrderMgtTablePanel } from './LibreOperatorOrderMgtTablePanel';

export const plugin = new PanelPlugin<LibreOperatorOrderMgtTableOptions>(LibreOperatorOrderMgtTablePanel)
  .setNoPadding()
  .setPanelOptions(builder => {
    return builder
      .addTextInput({
        path: 'eventMetric',
        name: 'Event Metric',
        description: 'Name of Query Metric with Event Data',
        defaultValue: 'Events',
      })
     .addTextInput({
        path: 'jobRequestID',
        name: 'Job Request ID Path',
        description: 'The path of job request ID with respect to Data Path',
        defaultValue: 'id',
      }).addTextInput({
        path: 'dispatchStatusPath',
        name: 'Path of Dispatch Status',
        description: 'The path of dispatch status with respect to Data Path',
        defaultValue: 'id',
      })
      .addColorPicker({
        path: 'active',
        name: 'ACTIVE Status Color',
        defaultValue: 'red',
        settings: {
          options: [
            {
              value: 'red',
              label: 'Red',
            }
          ],
        }
      }).addColorPicker({
        path: 'pending',
        name: 'PENDING Status Color',
        defaultValue: 'orange',
        settings: {
          options: [
            {
              value: 'orange',
              label: 'Orange',
            }
          ],
        }
      }).addColorPicker({
        path: 'PARKED',
        name: 'PARKED Status Color',
        defaultValue: 'blue',
        settings: {
          options: [
            {
              value: 'blue',
              label: 'Blue',
            }
          ],
        }
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
