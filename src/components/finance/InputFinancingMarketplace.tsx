/**
 * Input Financing Marketplace Component (UI Mockup)
 * Buy-now-pay-later for seeds, fertilizer, and equipment with supplier credit
 */

import { ShoppingCart, CreditCard, Calendar, Package, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const availableCredit = {
  total: 500000,
  used: 185000,
  available: 315000,
  nextPayment: 45000,
  nextPaymentDate: "2024-02-15",
};

const inputSuppliers = [
  {
    id: 1,
    name: "Amiran Kenya",
    category: "Seeds & Fertilizer",
    creditLimit: 200000,
    interestRate: 0,
    paymentTerms: "90 days interest-free",
    rating: 4.8,
    products: 156,
  },
  {
    id: 2,
    name: "Elgon Kenya",
    category: "Fertilizer & Chemicals",
    creditLimit: 150000,
    interestRate: 2.5,
    paymentTerms: "60 days, 2.5% monthly",
    rating: 4.6,
    products: 89,
  },
  {
    id: 3,
    name: "Syngenta East Africa",
    category: "Seeds & Crop Protection",
    creditLimit: 180000,
    interestRate: 0,
    paymentTerms: "120 days interest-free",
    rating: 4.9,
    products: 124,
  },
];

const activeFinancing = [
  {
    id: "FIN-001",
    supplier: "Amiran Kenya",
    items: "Hybrid Tomato Seeds (10kg), NPK Fertilizer (50kg)",
    amount: 85000,
    financed: "2024-01-10",
    dueDate: "2024-04-10",
    paid: 25000,
    remaining: 60000,
    status: "active",
  },
  {
    id: "FIN-002",
    supplier: "Elgon Kenya",
    items: "Foliar Fertilizer (20L), Pesticides",
    amount: 45000,
    financed: "2024-01-15",
    dueDate: "2024-03-15",
    paid: 15000,
    remaining: 30000,
    status: "active",
  },
  {
    id: "FIN-003",
    supplier: "Syngenta East Africa",
    items: "Cabbage Seeds (5kg), Fungicide",
    amount: 55000,
    financed: "2023-12-20",
    dueDate: "2024-02-20",
    paid: 55000,
    remaining: 0,
    status: "completed",
  },
];

const popularProducts = [
  { name: "Hybrid Tomato Seeds", supplier: "Amiran Kenya", price: 8500, unit: "1kg", financing: "90 days" },
  { name: "NPK Fertilizer 23:23:0", supplier: "Elgon Kenya", price: 4200, unit: "50kg", financing: "60 days" },
  { name: "Drip Irrigation Kit", supplier: "Amiran Kenya", price: 35000, unit: "1 acre", financing: "120 days" },
  { name: "Cabbage Seeds F1", supplier: "Syngenta", price: 6800, unit: "500g", financing: "90 days" },
];

export function InputFinancingMarketplace() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Input Financing Marketplace
            </CardTitle>
            <CardDescription>
              Buy-now-pay-later for seeds, fertilizer, and equipment
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credit Summary */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Available Credit</p>
              <p className="text-3xl font-bold text-foreground">{formatKsh(availableCredit.available)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Next Payment</p>
              <p className="text-lg font-bold text-foreground">{formatKsh(availableCredit.nextPayment)}</p>
              <p className="text-xs text-muted-foreground">{availableCredit.nextPaymentDate}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Credit Used</span>
              <span className="font-semibold">{formatKsh(availableCredit.used)} / {formatKsh(availableCredit.total)}</span>
            </div>
            <Progress value={(availableCredit.used / availableCredit.total) * 100} className="h-2" />
          </div>
        </div>

        {/* Supplier Partners */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Supplier Partners</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {inputSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {supplier.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-foreground">{supplier.rating}</span>
                    <span className="text-xs text-warning">★</span>
                  </div>
                </div>
                <p className="font-semibold text-foreground text-sm mb-1">{supplier.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{supplier.products} products available</p>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Credit Limit</span>
                    <span className="font-semibold text-foreground">{formatKsh(supplier.creditLimit)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Terms</span>
                    <span className="font-semibold text-foreground">{supplier.paymentTerms}</span>
                  </div>
                </div>
                <Button size="sm" className="w-full">
                  Browse Products
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Financing */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Active Financing</h3>
          <div className="space-y-2">
            {activeFinancing.map((fin) => (
              <div
                key={fin.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{fin.id}</p>
                    <p className="text-xs text-muted-foreground">{fin.supplier}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      fin.status === "completed"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }
                  >
                    {fin.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {fin.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{fin.items}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-semibold text-foreground">{formatKsh(fin.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-semibold text-success">{formatKsh(fin.paid)}</span>
                  </div>
                  {fin.remaining > 0 && (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-semibold text-foreground">{formatKsh(fin.remaining)}</span>
                      </div>
                      <Progress value={(fin.paid / fin.amount) * 100} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">Due: {fin.dueDate}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Products */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Popular Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {popularProducts.map((product, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3 hover:bg-muted/70 transition"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.supplier}</p>
                    <Badge variant="outline" className="bg-success/10 text-success text-xs mt-1">
                      {product.financing} financing
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatKsh(product.price)}</p>
                  <p className="text-xs text-muted-foreground">{product.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Browse Marketplace
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Payment Schedule
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Buy inputs now and pay after harvest. Interest-free periods range from 60-120 days depending on supplier. Credit limit based on your farm revenue and credit score.
        </div>
      </CardContent>
    </Card>
  );
}
