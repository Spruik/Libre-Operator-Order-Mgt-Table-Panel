export interface LibreOperatorOrderMgtTableOptions {
  broker: string;
  port: number;
  clientId: string;
  noOrder: string;
  basePath: string;
  secure: boolean;
}

export interface Order {
  line: string;
  order: string;
  product: string;
  scheduleStartTime: number;
  status: string;
  scheduleQuantity: number;
  actualQuantity?: number;
  rate: number;
  actualStartTime?: number;
  productDescription: string;
}
