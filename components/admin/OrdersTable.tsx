'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  // ArrowUpDown, // Unused import
  MoreHorizontal,
  Eye,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock order data
const mockOrders = Array.from({ length: 50 }, (_, i) => {
  const statuses = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];
  const status = statuses[Math.floor(Math.random() * (statuses.length - 1))]; // Less chance for cancelled

  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));

  const amount = Math.floor(Math.random() * 1500) + 100;

  return {
    id: `ord_${i + 1}`,
    orderNumber: `STR-2024-${1000 + i}`,
    customer: [
      'Emma Wilson',
      'Michael Brown',
      'Sophia Martinez',
      'James Johnson',
      'Olivia Davis',
      'William Miller',
      'Ava Garcia',
      'Benjamin Rodriguez',
      'Charlotte Wilson',
      'Lucas Anderson',
    ][i % 10],
    email: [
      'emma@example.com',
      'michael@example.com',
      'sophia@example.com',
      'james@example.com',
      'olivia@example.com',
      'william@example.com',
      'ava@example.com',
      'benjamin@example.com',
      'charlotte@example.com',
      'lucas@example.com',
    ][i % 10],
    items: Math.floor(Math.random() * 5) + 1,
    total: `£${amount.toFixed(2)}`,
    status,
    paymentStatus:
      status === 'cancelled'
        ? 'refunded'
        : status === 'pending'
          ? 'pending'
          : 'paid',
    shippingMethod: ['standard', 'express', 'overnight'][
      Math.floor(Math.random() * 3)
    ],
    date: date.toISOString(),
  };
});

export function OrdersTable() {
  const [orders] = useState(mockOrders);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const itemsPerPage = 10;

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-success bg-green-50';
      case 'shipped':
        return 'text-info bg-blue-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'confirmed':
        return 'text-purple-600 bg-purple-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      case 'cancelled':
        return 'text-destructive bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-success';
      case 'pending':
        return 'text-yellow-600';
      case 'refunded':
        return 'text-destructive';
      default:
        return 'text-gray-600';
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    if (selectedOrders.length === currentOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(currentOrders.map((order) => order.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {statusFilter && (
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {statusFilter}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                All Orders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('confirmed')}>
                Confirmed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('processing')}>
                Processing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('shipped')}>
                Shipped
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('delivered')}>
                Delivered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {selectedOrders.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''}{' '}
            selected
          </span>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Labels
            </Button>
            <Button size="sm" variant="outline">
              Update Status
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedOrders([])}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  checked={
                    selectedOrders.length === currentOrders.length &&
                    currentOrders.length > 0
                  }
                  onChange={toggleAllOrders}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleOrderSelection(order.id)}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer}</div>
                    <div className="text-sm text-gray-500">{order.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(order.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.date).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </TableCell>
                <TableCell>{order.items}</TableCell>
                <TableCell className="font-medium">{order.total}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status || '')}`}
                  >
                    {order.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}
                  >
                    {order.paymentStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{order.shippingMethod}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}{' '}
          orders
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-3">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}
