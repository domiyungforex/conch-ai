"use client";

import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResourcePanel } from "@/components/modules/ResourcePanel";
import { CreditProfilePanel } from "./CreditProfilePanel";
import { AssistantPanel } from "@/components/modules/AssistantPanel";
import type {
  AppwriteDoc, BusinessDoc, BusinessCustomerDoc, BusinessSupplierDoc, BusinessProductDoc,
  BusinessOrderDoc, BusinessInventoryDoc, BusinessExpenseDoc, BusinessRevenueDoc,
} from "@/lib/db";

async function fetchBusiness(id: string): Promise<AppwriteDoc<BusinessDoc>> {
  const res = await fetch(`/api/business/${id}`);
  if (!res.ok) throw new Error("Failed to load business");
  const data = await res.json();
  return data.item;
}

export function BusinessDetailClient({ businessId }: { businessId: string }) {
  const { data: business, isLoading, isError } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => fetchBusiness(businessId),
  });

  const base = `/api/business/${businessId}`;

  if (isLoading) return <div className="h-24 animate-pulse bg-white/5 rounded-xl" />;
  if (isError || !business) return <p className="text-sm text-red-400">Couldn&apos;t load this business.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{business.name}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {business.industry ?? "No industry set"} · {business.region} · {business.currency}
        </p>
      </div>

      <Tabs defaultValue="customers">
        <TabsList className="glass border border-white/10 h-9 flex-wrap h-auto">
          <TabsTrigger value="customers" className="text-xs px-3">Customers</TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs px-3">Suppliers</TabsTrigger>
          <TabsTrigger value="products" className="text-xs px-3">Products</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs px-3">Orders</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs px-3">Inventory</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs px-3">Expenses</TabsTrigger>
          <TabsTrigger value="revenues" className="text-xs px-3">Revenue</TabsTrigger>
          <TabsTrigger value="credit" className="text-xs px-3">Credit Profile</TabsTrigger>
          <TabsTrigger value="assistant" className="text-xs px-3">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-4">
          <ResourcePanel<AppwriteDoc<BusinessCustomerDoc>>
            basePath={`${base}/customers`}
            title="Customers"
            emptyLabel="No customers yet."
            fields={[
              { key: "name", label: "Name", type: "text" },
              { key: "email", label: "Email", type: "text" },
              { key: "phone", label: "Phone", type: "text" },
              { key: "notes", label: "Notes", type: "textarea" },
            ]}
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email", render: (c) => c.email ?? "" },
              { key: "phone", label: "Phone", render: (c) => c.phone ?? "" },
              { key: "totalSpentUsd", label: "Total Spent", render: (c) => `$${Number(c.totalSpentUsd ?? 0).toFixed(2)}` },
            ]}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <ResourcePanel<AppwriteDoc<BusinessSupplierDoc>>
            basePath={`${base}/suppliers`}
            title="Suppliers"
            emptyLabel="No suppliers yet."
            fields={[
              { key: "name", label: "Name", type: "text" },
              { key: "contact", label: "Contact", type: "text" },
              { key: "notes", label: "Notes", type: "textarea" },
            ]}
            columns={[
              { key: "name", label: "Name" },
              { key: "contact", label: "Contact", render: (s) => s.contact ?? "" },
            ]}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ResourcePanel<AppwriteDoc<BusinessProductDoc>>
            basePath={`${base}/products`}
            title="Products"
            emptyLabel="No products yet."
            fields={[
              { key: "name", label: "Name", type: "text" },
              { key: "sku", label: "SKU", type: "text" },
              { key: "priceUsd", label: "Price (USD)", type: "number" },
              { key: "costUsd", label: "Cost (USD)", type: "number" },
              { key: "category", label: "Category", type: "text" },
            ]}
            columns={[
              { key: "name", label: "Name" },
              { key: "sku", label: "SKU", render: (p) => p.sku ?? "" },
              { key: "priceUsd", label: "Price", render: (p) => `$${Number(p.priceUsd ?? 0).toFixed(2)}` },
              { key: "category", label: "Category", render: (p) => p.category ?? "" },
            ]}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <ResourcePanel<AppwriteDoc<BusinessOrderDoc>>
            basePath={`${base}/orders`}
            title="Orders"
            emptyLabel="No orders yet."
            fields={[
              { key: "itemsJson", label: "Items (JSON)", type: "textarea", placeholder: '[{"name":"Widget","qty":2}]' },
              { key: "totalUsd", label: "Total (USD)", type: "number" },
              {
                key: "status", label: "Status", type: "select", defaultValue: "pending",
                options: [
                  { value: "pending", label: "Pending" },
                  { value: "fulfilled", label: "Fulfilled" },
                  { value: "cancelled", label: "Cancelled" },
                ],
              },
              { key: "orderedAt", label: "Ordered at", type: "datetime" },
            ]}
            columns={[
              { key: "status", label: "Status" },
              { key: "totalUsd", label: "Total", render: (o) => `$${Number(o.totalUsd ?? 0).toFixed(2)}` },
              { key: "orderedAt", label: "Ordered", render: (o) => new Date(o.orderedAt).toLocaleDateString() },
            ]}
          />
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <ResourcePanel<AppwriteDoc<BusinessInventoryDoc>>
            basePath={`${base}/inventory`}
            title="Inventory"
            emptyLabel="No inventory records yet."
            fields={[
              { key: "productId", label: "Product ID", type: "text" },
              { key: "quantity", label: "Quantity", type: "number" },
              { key: "reorderThreshold", label: "Reorder threshold", type: "number" },
              { key: "location", label: "Location", type: "text" },
            ]}
            columns={[
              { key: "productId", label: "Product ID" },
              { key: "quantity", label: "Qty" },
              { key: "reorderThreshold", label: "Reorder at" },
              { key: "location", label: "Location", render: (i) => i.location ?? "" },
            ]}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <ResourcePanel<AppwriteDoc<BusinessExpenseDoc>>
            basePath={`${base}/expenses`}
            title="Expenses"
            emptyLabel="No expenses logged yet."
            fields={[
              { key: "category", label: "Category", type: "text" },
              { key: "amountUsd", label: "Amount (USD)", type: "number" },
              { key: "incurredAt", label: "Date", type: "datetime" },
              { key: "notes", label: "Notes", type: "textarea" },
            ]}
            columns={[
              { key: "category", label: "Category" },
              { key: "amountUsd", label: "Amount", render: (e) => `$${Number(e.amountUsd ?? 0).toFixed(2)}` },
              { key: "incurredAt", label: "Date", render: (e) => new Date(e.incurredAt).toLocaleDateString() },
            ]}
          />
        </TabsContent>

        <TabsContent value="revenues" className="mt-4">
          <ResourcePanel<AppwriteDoc<BusinessRevenueDoc>>
            basePath={`${base}/revenues`}
            title="Revenue"
            emptyLabel="No revenue logged yet."
            fields={[
              { key: "source", label: "Source", type: "text" },
              { key: "amountUsd", label: "Amount (USD)", type: "number" },
              { key: "receivedAt", label: "Date", type: "datetime" },
              { key: "notes", label: "Notes", type: "textarea" },
            ]}
            columns={[
              { key: "source", label: "Source" },
              { key: "amountUsd", label: "Amount", render: (r) => `$${Number(r.amountUsd ?? 0).toFixed(2)}` },
              { key: "receivedAt", label: "Date", render: (r) => new Date(r.receivedAt).toLocaleDateString() },
            ]}
          />
        </TabsContent>

        <TabsContent value="credit" className="mt-4">
          <CreditProfilePanel businessId={businessId} />
        </TabsContent>

        <TabsContent value="assistant" className="mt-4">
          <AssistantPanel
            askPath={`${base}/ask`}
            placeholder="e.g. Which customers haven't ordered this month?"
            hint="The assistant answers from this business's own records — customers, suppliers, products, orders, inventory, expenses, and revenue. It won't invent anything not in the records."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
