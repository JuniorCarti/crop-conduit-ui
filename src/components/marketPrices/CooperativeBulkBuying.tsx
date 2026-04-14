/**
 * Cooperative Bulk Buying Power Component
 * Farmers pool orders for inputs to get bulk discounts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, TrendingDown, Package, Truck, Calendar } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface BulkOrder {
  id: string;
  product: string;
  category: "Seeds" | "Fertilizer" | "Pesticides" | "Tools";
  supplier: string;
  targetQuantity: number;
  currentQuantity: number;
  participants: number;
  pricePerUnit: {
    retail: number;
    bulk: number;
    discount: number;
  };
  deadline: string;
  daysLeft: number;
  deliveryDate: string;
  status: "Open" | "Almost Full" | "Closed";
}

const MOCK_ORDERS: BulkOrder[] = [
  {
    id: "1",
    product: "Hybrid Tomato Seeds (1kg)",
    category: "Seeds",
    supplier: "Kenya Seed Company",
    targetQuantity: 100,
    currentQuantity: 78,
    participants: 45,
    pricePerUnit: {
      retail: 5000,
      bulk: 3500,
      discount: 30,
    },
    deadline: "In 3 days",
    daysLeft: 3,
    deliveryDate: "Jan 25, 2024",
    status: "Almost Full",
  },
  {
    id: "2",
    product: "NPK Fertilizer (50kg bag)",
    category: "Fertilizer",
    supplier: "Yara Kenya",
    targetQuantity: 200,
    currentQuantity: 145,
    participants: 89,
    pricePerUnit: {
      retail: 4500,
      bulk: 3200,
      discount: 29,
    },
    deadline: "In 5 days",
    daysLeft: 5,
    deliveryDate: "Jan 27, 2024",
    status: "Open",
  },
  {
    id: "3",
    product: "Organic Pesticide (5L)",
    category: "Pesticides",
    supplier: "Osho Chemical",
    targetQuantity: 50,
    currentQuantity: 48,
    participants: 32,
    pricePerUnit: {
      retail: 3000,
      bulk: 2100,
      discount: 30,
    },
    deadline: "In 2 days",
    daysLeft: 2,
    deliveryDate: "Jan 24, 2024",
    status: "Almost Full",
  },
];

const MY_SAVINGS = {
  thisMonth: 12500,
  thisYear: 45000,
  totalOrders: 8,
  avgDiscount: 28,
};

export function CooperativeBulkBuying() {
  const getStatusColor = (status: string) => {
    if (status === "Almost Full") return "bg-orange-100 text-orange-700 border-orange-300";
    if (status === "Closed") return "bg-red-100 text-red-700 border-red-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  const getCategoryIcon = (category: string) => {
    if (category === "Seeds") return "🌱";
    if (category === "Fertilizer") return "🧪";
    if (category === "Pesticides") return "🛡️";
    return "🔧";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Cooperative Bulk Buying Power
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Pool orders with other farmers for massive discounts</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* My Savings Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
          <h5 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Your Bulk Buying Savings
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">This Month</p>
              <p className="text-2xl font-bold text-green-600">{formatKsh(MY_SAVINGS.thisMonth)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">This Year</p>
              <p className="text-2xl font-bold text-green-600">{formatKsh(MY_SAVINGS.thisYear)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{MY_SAVINGS.totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg Discount</p>
              <p className="text-2xl font-bold text-purple-600">{MY_SAVINGS.avgDiscount}%</p>
            </div>
          </div>
        </div>

        {/* Active Bulk Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold">Active Bulk Orders</h5>
            <Badge variant="outline">{MOCK_ORDERS.length} orders available</Badge>
          </div>

          {MOCK_ORDERS.map((order) => (
            <div
              key={order.id}
              className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{getCategoryIcon(order.category)}</div>
                  <div>
                    <h6 className="font-bold text-lg">{order.product}</h6>
                    <p className="text-sm text-muted-foreground">by {order.supplier}</p>
                    <Badge variant="outline" className="mt-1">{order.category}</Badge>
                  </div>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold">Order Progress</span>
                  <span className="text-muted-foreground">
                    {order.currentQuantity} / {order.targetQuantity} units
                  </span>
                </div>
                <Progress 
                  value={(order.currentQuantity / order.targetQuantity) * 100} 
                  className="h-3"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>{order.participants} farmers joined</span>
                  <span>{Math.round((order.currentQuantity / order.targetQuantity) * 100)}% complete</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Retail Price</p>
                  <p className="text-lg font-bold line-through text-gray-400">
                    {formatKsh(order.pricePerUnit.retail)}
                  </p>
                </div>
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-700 mb-1">Bulk Price</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatKsh(order.pricePerUnit.bulk)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-700 mb-1">You Save</p>
                  <p className="text-lg font-bold text-blue-600">
                    {order.pricePerUnit.discount}%
                  </p>
                </div>
              </div>

              {/* Deadline & Delivery */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded p-2">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-xs text-amber-700">Order Closes</p>
                    <p className="font-semibold text-sm text-amber-900">{order.deadline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded p-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-700">Delivery Date</p>
                    <p className="font-semibold text-sm text-blue-900">{order.deliveryDate}</p>
                  </div>
                </div>
              </div>

              {/* Savings Calculation */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-green-900 mb-2">💰 Your Potential Savings</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">1 unit</p>
                    <p className="font-bold text-green-600">
                      Save {formatKsh(order.pricePerUnit.retail - order.pricePerUnit.bulk)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">5 units</p>
                    <p className="font-bold text-green-600">
                      Save {formatKsh((order.pricePerUnit.retail - order.pricePerUnit.bulk) * 5)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">10 units</p>
                    <p className="font-bold text-green-600">
                      Save {formatKsh((order.pricePerUnit.retail - order.pricePerUnit.bulk) * 10)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  View Details
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Join Order
                </Button>
              </div>

              {/* Urgency Badge */}
              {order.daysLeft <= 3 && (
                <div className="mt-3 bg-orange-50 border border-orange-200 rounded p-2 text-center">
                  <p className="text-sm font-semibold text-orange-900">
                    ⏰ Only {order.daysLeft} days left to join!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create New Order */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h5 className="font-semibold mb-2">Need Something Else?</h5>
          <p className="text-sm text-muted-foreground mb-4">
            Start a new bulk order and invite other farmers to join
          </p>
          <Button className="bg-green-600 hover:bg-green-700">
            <Users className="h-4 w-4 mr-2" />
            Start New Bulk Order
          </Button>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-3">🤝 How Bulk Buying Works</h5>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span><strong>Join an Order:</strong> Browse active bulk orders and join ones you need</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span><strong>Wait for Target:</strong> Order closes when target quantity is reached</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span><strong>Supplier Delivers:</strong> Bulk order is placed with supplier at discount price</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span><strong>Collect Your Share:</strong> Pick up your portion at local collection point</span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-3">✨ Benefits of Bulk Buying</h5>
          <ul className="space-y-2 text-sm text-green-700">
            <li className="flex items-start gap-2">
              <span>💰</span>
              <span><strong>Save 20-40%:</strong> Get wholesale prices by buying together</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚚</span>
              <span><strong>Free Delivery:</strong> Shared transport costs included</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span><strong>Quality Guaranteed:</strong> Verified suppliers only</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🤝</span>
              <span><strong>Community Power:</strong> Negotiate better deals as a group</span>
            </li>
          </ul>
        </div>

        {/* Success Stories */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-semibold text-purple-900 mb-3">🌟 Success Stories</h5>
          <div className="space-y-3">
            <div className="bg-white rounded p-3">
              <p className="text-sm mb-1">
                <span className="font-semibold">"Saved KSh 15,000 on fertilizer!"</span>
              </p>
              <p className="text-xs text-muted-foreground">- John K., Kiambu</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm mb-1">
                <span className="font-semibold">"Got premium seeds at 35% discount"</span>
              </p>
              <p className="text-xs text-muted-foreground">- Mary W., Nakuru</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
