"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Phone, UserPlus, Upload } from "lucide-react"
import { toast } from "sonner"
import CustomerForm from "./customer-form"
import AICallDialog from "./ai-call-dialog"

// Customer type definition
type Customer = {
  id: string
  name: string
  email: string
  phone: string
  company: string
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isAICallOpen, setIsAICallOpen] = useState(false)

  // Handle CSV import
  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = text.split("\n")
      const headers = rows[0].split(",")

      // Map CSV columns to customer properties
      const nameIndex = headers.findIndex((h) => h.toLowerCase().includes("name"))
      const emailIndex = headers.findIndex((h) => h.toLowerCase().includes("email"))
      const phoneIndex = headers.findIndex((h) => h.toLowerCase().includes("phone"))
      const companyIndex = headers.findIndex((h) => h.toLowerCase().includes("company"))

      const importedCustomers: Customer[] = []

      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue

        const values = rows[i].split(",")
        importedCustomers.push({
          id: `cust-${Date.now()}-${i}`,
          name: values[nameIndex] || "",
          email: values[emailIndex] || "",
          phone: values[phoneIndex] || "",
          company: values[companyIndex] || "",
        })
      }

      setCustomers((prev) => [...prev, ...importedCustomers])
      toast(`Imported ${importedCustomers.length} customers`)
    }

    reader.readAsText(file)
    // Reset the input value so the same file can be selected again
    event.target.value = ""
  }

  // Add a new customer
  const addCustomer = (customer: Omit<Customer, "id">) => {
    const newCustomer = {
      ...customer,
      id: `cust-${Date.now()}`,
    }
    setCustomers((prev) => [...prev, newCustomer])
    toast(`${customer.name} has been added to the list`)
  }

  // Start AI call with customer
  const startAICall = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsAICallOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-xl font-semibold">Customer List</h2>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <CustomerForm onSubmit={addCustomer} />
            </DialogContent>
          </Dialog>

          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
              aria-label="Import CSV"
            />
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>
        </div>
      </div>

      {customers.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.company}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" onClick={() => startAICall(customer)} title="Start AI Call">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground">No customers yet. Add customers manually or import from CSV.</p>
        </div>
      )}

      <AICallDialog isOpen={isAICallOpen} onClose={() => setIsAICallOpen(false)} customer={selectedCustomer} />
    </div>
  )
}

