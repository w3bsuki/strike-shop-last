'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// BUNDLE OPTIMIZATION: Lazy load Recharts components (~1MB)
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart-dynamic';

export function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>(
    'week'
  );

  // Mock data for the dashboard
  const stats = [
    {
      title: 'Total Revenue',
      value: '£24,532',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Orders',
      value: '324',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingBag,
    },
    {
      title: 'Customers',
      value: '1,893',
      change: '+4.3%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Products',
      value: '452',
      change: '-2.1%',
      trend: 'down',
      icon: Package,
    },
  ];

  const revenueData = [
    { date: 'Mon', revenue: 1200 },
    { date: 'Tue', revenue: 1800 },
    { date: 'Wed', revenue: 1600 },
    { date: 'Thu', revenue: 2200 },
    { date: 'Fri', revenue: 1800 },
    { date: 'Sat', revenue: 2400 },
    { date: 'Sun', revenue: 2100 },
  ];

  const recentOrders = [
    {
      id: 'STR-2024-003',
      customer: 'Emma Wilson',
      date: '2024-01-20',
      amount: '£1,245.00',
      status: 'pending',
    },
    {
      id: 'STR-2024-002',
      customer: 'Michael Brown',
      date: '2024-01-19',
      amount: '£845.50',
      status: 'shipped',
    },
    {
      id: 'STR-2024-001',
      customer: 'Sophia Martinez',
      date: '2024-01-18',
      amount: '£320.75',
      status: 'delivered',
    },
    {
      id: 'STR-2023-998',
      customer: 'James Johnson',
      date: '2024-01-17',
      amount: '£1,120.00',
      status: 'delivered',
    },
    {
      id: 'STR-2023-997',
      customer: 'Olivia Davis',
      date: '2024-01-16',
      amount: '£540.25',
      status: 'delivered',
    },
  ];

  const topProducts = [
    {
      name: 'Monochrome Knit Sweater',
      sales: 124,
      revenue: '£55,800',
      stock: 45,
    },
    {
      name: 'Technical Bomber Jacket',
      sales: 98,
      revenue: '£117,600',
      stock: 12,
    },
    {
      name: 'Utility Crossbody Bag',
      sales: 87,
      revenue: '£27,840',
      stock: 32,
    },
    {
      name: 'Oversized Graphic Hoodie',
      sales: 76,
      revenue: '£51,680',
      stock: 28,
    },
    {
      name: 'Chunky Sole Sneakers',
      sales: 65,
      revenue: '£57,850',
      stock: 8,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'shipped':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'pending':
        return 'text-purple-600 bg-purple-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <Button
            variant={timeRange === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('day')}
          >
            Day
          </Button>
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
          <Button
            variant={timeRange === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('year')}
          >
            Year
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          const trendColor =
            stat.trend === 'up' ? 'text-green-600' : 'text-red-600';

          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center pt-1">
                  <span className={`text-xs font-medium ${trendColor}`}>
                    {stat.change}
                  </span>
                  <TrendIcon className={`h-3 w-3 ml-1 ${trendColor}`} />
                  <span className="text-xs text-gray-500 ml-2">
                    from last period
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Daily revenue for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                revenue: {
                  label: 'Revenue',
                  color: 'hsl(var(--primary))',
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{order.customer}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{order.id}</span>
                      <span className="mx-1">•</span>
                      <span>{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-medium">{order.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>
                Best selling products this month
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{product.sales} sold</span>
                      <span className="mx-1">•</span>
                      <span>{product.stock} in stock</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{product.revenue}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
