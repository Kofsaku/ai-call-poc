"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AICallButton from "./ai-call-dialog"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  company: string
}

const defaultCustomer: Customer = {
  id: "1",
  name: "津端",
  email: "kosaku.tsubata@gmail.com",
  phone: "819062660207",
  company: "asfdasdf"
}

export default function CustomerList() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>{defaultCustomer.name}</TableCell>
          <TableCell>{defaultCustomer.email}</TableCell>
          <TableCell>{defaultCustomer.phone}</TableCell>
          <TableCell>{defaultCustomer.company}</TableCell>
          <TableCell>
            <AICallButton />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
} 