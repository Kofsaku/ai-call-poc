import CustomerList from "@/components/customer-list"

export default function Home() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">顧客リスト</h1>
      <CustomerList />
    </main>
  )
}

