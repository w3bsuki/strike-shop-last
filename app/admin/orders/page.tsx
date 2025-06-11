"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock order data
const mockOrders = Array.from({ length: 50 }, (_, i) => {
  const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
  const status = statuses[Math.floor(Math.random() * (statuses.length - 1))] // Less chance for cancelled

  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * 30))

  const amount = Math.floor(Math.random() * 1500) + 100

  return {
    id: `ord_${i + 1}`,
    orderNumber: `STR-2024-${1000 + i}`,
    customer: [
      "Emma Wilson",
      "Michael Brown",
      "Sophia Martinez",
      "James Johnson",
      "Olivia Davis",
      "William Miller",
      "Ava Garcia",
      "Benjamin Rodriguez",
      "Charlotte Wilson",
      "Lucas Anderson",
    ][i % 10],
    email: [
      "emma@example.com",
      "michael@example.com",
      "sophia@example.com",
      "james@example.com",
      "olivia@example.com",
      "william@example.com",
      "ava@example.com",
      "benjamin@example.com",
      "charlotte@example.com",
      "lucas@example.com",
    ][i % 10],
    date: date.toISOString(),
    amount: `£${amount.toFixed(2)}`,
    items: Math.floor(Math.random() * 5) + 1,
    status,
    paymentStatus: Math.random() > 0.1 ? "paid" : "pending",
  }
})

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string | null>(null)

  const itemsPerPage = 10

  // Filter and sort orders
  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === null || order.status === selectedStatus
    const matchesPaymentStatus = selectedPaymentStatus === null || order.paymentStatus === selectedPaymentStatus

    return matchesSearch && matchesStatus && matchesPaymentStatus
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortField) return 0

    let comparison = 0
    if (sortField === "date") {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
    } else if (sortField === "amount") {
      const aAmount = Number.parseFloat(a.amount.replace(/[^0-9.]/g, ""))
      const bAmount = Number.parseFloat(b.amount.replace(/[^0-9.]/g, ""))
      comparison = aAmount - bAmount
    } else if (sortField === "items") {
      comparison = a.items - b.items
    } else if (sortField === "orderNumber") {
      comparison = a.orderNumber.localeCompare(b.orderNumber)
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get unique statuses for filter
  const statuses = Array.from(new Set(mockOrders.map((o) => o.status)))
  const paymentStatuses = Array.from(new Set(mockOrders.map((o) => o.paymentStatus)))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-purple-100 text-purple-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedStatus(null)}>All Statuses</DropdownMenuItem>
              {statuses.map((status) => (
                <DropdownMenuItem key={status} onClick={() => setSelectedStatus(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Payment
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedPaymentStatus(null)}>All Payment Statuses</DropdownMenuItem>
              {paymentStatuses.map((status) => (
                <DropdownMenuItem key={status} onClick={() => setSelectedPaymentStatus(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Applied filters */}
      {(selectedStatus || selectedPaymentStatus) && (
        <div className="flex flex-wrap gap-2">
          {selectedStatus && (
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
              Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
              <button onClick={() => setSelectedStatus(null)} className="ml-2 text-gray-500 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {selectedPaymentStatus && (
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
              Payment: {selectedPaymentStatus.charAt(0).toUpperCase() + selectedPaymentStatus.slice(1)}
              <button onClick={() => setSelectedPaymentStatus(null)} className="ml-2 text-gray-500 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {(selectedStatus || selectedPaymentStatus) && (
            <button
              onClick={() => {
                setSelectedStatus(null)
                setSelectedPaymentStatus(null)
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Orders Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => handleSort("orderNumber")} className="flex items-center hover:text-gray-700">
                  Order
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>
                <button onClick={() => handleSort("date")} className="flex items-center hover:text-gray-700">
                  Date
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("amount")} className="flex items-center hover:text-gray-700">
                  Total
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("items")} className="flex items-center hover:text-gray-700">
                  Items
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div>{order.customer}</div>
                      <div className="text-xs text-gray-500">{order.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Printer className="h-4 w-4 mr-2" />
                          Print Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
