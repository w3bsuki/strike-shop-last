'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  UserX,
  Mail,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
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

// Mock user data
const mockUsers = Array.from({ length: 50 }, (_, i) => {
  const roles = ['customer', 'customer', 'customer', 'admin', 'customer'];
  const role = roles[Math.floor(Math.random() * roles.length)];

  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 365));

  const firstNames = [
    'Emma',
    'Michael',
    'Sophia',
    'James',
    'Olivia',
    'William',
    'Ava',
    'Benjamin',
    'Charlotte',
    'Lucas',
  ];
  const lastNames = [
    'Wilson',
    'Brown',
    'Martinez',
    'Johnson',
    'Davis',
    'Miller',
    'Garcia',
    'Rodriguez',
    'Wilson',
    'Anderson',
  ];

  const firstName = firstNames[i % 10];
  const lastName = lastNames[i % 10];

  return {
    id: `user_${i + 1}`,
    firstName,
    lastName,
    email: `${(firstName ?? "user").toLowerCase()}.${(lastName ?? "name").toLowerCase()}@example.com`,
    avatar: `/placeholder.svg?height=40&width=40&query=avatar+${i + 1}`,
    role,
    status: Math.random() > 0.1 ? 'active' : 'inactive',
    orders: Math.floor(Math.random() * 20),
    totalSpent: `£${(Math.floor(Math.random() * 10000) / 100).toFixed(2)}`,
    createdAt: date.toISOString(),
  };
});

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const itemsPerPage = 10;

  // Filter and sort users
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      searchTerm === '' ||
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === null || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === null || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    if (sortField === 'name') {
      comparison = `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`
      );
    } else if (sortField === 'orders') {
      comparison = a.orders - b.orders;
    } else if (sortField === 'totalSpent') {
      const aAmount = Number.parseFloat(a.totalSpent.replace(/[^0-9.]/g, ''));
      const bAmount = Number.parseFloat(b.totalSpent.replace(/[^0-9.]/g, ''));
      comparison = aAmount - bAmount;
    } else if (sortField === 'createdAt') {
      comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get unique roles and statuses for filter
  const roles = Array.from(new Set(mockUsers.map((u) => u.role)));
  const statuses = Array.from(new Set(mockUsers.map((u) => u.status)));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <Button className="mt-2 sm:mt-0">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
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
                Role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedRole(null)}>
                All Roles
              </DropdownMenuItem>
              {roles.map((role) => (
                <DropdownMenuItem
                  key={role}
                  onClick={() => setSelectedRole(role || null)}
                >
                  {role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                All Statuses
              </DropdownMenuItem>
              {statuses.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Applied filters */}
      {(selectedRole || selectedStatus) && (
        <div className="flex flex-wrap gap-2">
          {selectedRole && (
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
              Role:{' '}
              {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              <button
                onClick={() => setSelectedRole(null)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {selectedStatus && (
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
              Status:{' '}
              {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
              <button
                onClick={() => setSelectedStatus(null)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {(selectedRole || selectedStatus) && (
            <button
              onClick={() => {
                setSelectedRole(null);
                setSelectedStatus(null);
              }}
              className="text-sm text-info hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Users Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center hover:text-gray-700"
                >
                  Name
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('orders')}
                  className="flex items-center hover:text-gray-700"
                >
                  Orders
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('totalSpent')}
                  className="flex items-center hover:text-gray-700"
                >
                  Total Spent
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center hover:text-gray-700"
                >
                  Joined
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                      <Image
                        src={user.avatar || '/placeholder.svg'}
                        alt={`${user.firstName} ${user.lastName}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        (user.role ?? "") === "admin"
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status.charAt(0).toUpperCase() +
                        user.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{user.orders}</TableCell>
                  <TableCell>{user.totalSpent}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
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
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Email User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <UserX className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-gray-500"
                >
                  No users found
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
            {filteredUsers.length} users
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
  );
}
