import CustomerManagement from "@/components/customer-management"

export default function Home() {
  return (
    <main className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Customer Management System</h1>
      <CustomerManagement />
    </main>
  )
}

