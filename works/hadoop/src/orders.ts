// Animation sample data, not production metrics.
export const orderDate = '2026-11-16';
export const orderPath = `/warehouse/dwd/orders/dt=${orderDate}/`;
export const orders = [
  { id: 'O-1001', user: 'U-01', province: '江苏', amount: '100.00', status: '已发货', time: '09:10:00' },
  { id: 'O-1002', user: 'U-02', province: '广东', amount: '80.00', status: '已支付', time: '09:12:00' },
  { id: 'O-1003', user: 'U-03', province: '江苏', amount: '50.00', status: '已完成', time: '09:14:00' },
] as const;
