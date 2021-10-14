import React, { useState } from 'react';
import { GrafanaTheme, PanelProps } from '@grafana/data';
import { Button, getScrollbarWidth, HorizontalGroup, Modal, styleMixins, stylesFactory, useTheme } from '@grafana/ui';
import { SystemJS } from '@grafana/runtime';
import { css } from 'emotion';

import { LibreOperatorOrderMgtTableOptions, Order } from 'types';

//const { alertError, alertSuccess } = AppEvents;

interface Props extends PanelProps<LibreOperatorOrderMgtTableOptions> {}

const COLUMNS: string[] = [
  'Line',
  'Order',
  'Prod. Id',
  'Date',
  'Status',
  'QTY',
  'Complete',
  'Rate',
  'Start Time',
  'Prod. Description',
];

export const LibreOperatorOrderMgtTablePanel: React.FC<Props> = ({ options, data, width, height }) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  //@ts-ignore
  const dashboardAlert = (type: any, msg: string) => {
    SystemJS.load('app/core/app_events').then((events: any) => {
      events.emit(type, [msg]);
    });
  };

  console.log(data);

  const startOrder = (e: any) => {
    console.log(e);
  };

  const stopOrder = (e: any) => {
    console.log(e);
  };

  const onOrderClick = (event: any, order: Order) => {
    setSelectedOrder(order);
  };

  const dismissOrder = () => {
    setSelectedOrder(null);
  };

  const orders: Order[] = [];

  return (
    <div role="table" className={styles.wrapper}>
      <table width={width}>
        <thead className={styles.thead}>
          <tr>
            {COLUMNS.map(column => {
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
                <>
                  <tr
                    className={styles.row(order.status)}
                    onClick={e => {
                      onOrderClick(e, order);
                    }}
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
                </>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

const getStatusColor = (status: string | undefined, theme?: string) => {
  if (status === undefined || status === null) {
    return '#FFFFFFFF';
  }

  switch (status.toLowerCase()) {
    case 'planned':
      return theme === 'light' ? '#C9C9C9' : '#636363';
    case 'next':
      return theme === 'light' ? '#FFFB85' : '#636112';
    case 'running':
      return theme === 'light' ? '#91F449' : '#3B631E';
    case 'paused':
      return theme === 'light' ? '#E8B20C' : '#634C05';
    case 'complete':
      return theme === 'light' ? '#70C6FF' : '#2C4D63';
    case 'closed':
      return theme === 'light' ? '#FF7773' : '#632F2D';
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

  const buildCellContainerStyle = (status?: string) => {
    const background = getStatusColor(status, themeName);
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

  const buildRowStyle = (status?: string) => {
    const statusColour = getStatusColor(status, themeName);

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
    row: buildRowStyle,
  };
});
