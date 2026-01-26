/**
 * Payment Modal Component
 * Supports M-Pesa, Airtel Money, and Stripe Card payments
 */

import { useState } from "react";
import { CreditCard, Smartphone, Building2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCard } from "@/components/shared/AlertCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInitiatePayment } from "../hooks/useMarketplace";
import { formatKsh } from "@/lib/currency";
import type { Order } from "../models/types";

type PaymentMethod = "mpesa" | "airtel" | "card";

interface PaymentModalProps {
  order: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentModal({ order, onSuccess, onCancel }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [phone, setPhone] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
  const initiatePayment = useInitiatePayment();

  const handleMpesaPayment = async () => {
    if (!phone.trim()) {
      setError("Please enter your M-Pesa phone number");
      return;
    }

    let formattedPhone = phone.replace(/\s+/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    try {
      setPaymentStatus("pending");
      setError(null);
      await initiatePayment.mutateAsync({
        orderId: order.id!,
        phone: formattedPhone,
        amount: order.priceTotal,
      });

      if (import.meta.env.VITE_MPESA_MOCK_MODE === "true") {
        setTimeout(() => {
          setPaymentStatus("success");
          setTimeout(() => onSuccess?.(), 2000);
        }, 3000);
      }
    } catch (error: any) {
      setPaymentStatus("failed");
      setError(error.message || "Payment failed");
    }
  };

  const handleAirtelPayment = async () => {
    if (!phone.trim()) {
      setError("Please enter your Airtel Money phone number");
      return;
    }

    try {
      if (import.meta.env.VITE_AIRTEL_MOCK_MODE !== "true") {
        setPaymentStatus("failed");
        setError("Airtel Money payments are not configured.");
        return;
      }

      setPaymentStatus("pending");
      setError(null);

      // In mock mode, auto-complete
      setTimeout(() => {
        setPaymentStatus("success");
        setTimeout(() => onSuccess?.(), 2000);
      }, 3000);
    } catch (error: any) {
      setPaymentStatus("failed");
      setError(error.message || "Airtel Money payment failed");
    }
  };

  const handleCardPayment = async () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
      setError("Please fill in all card details");
      return;
    }

    try {
      if (import.meta.env.VITE_STRIPE_MOCK_MODE !== "true") {
        setPaymentStatus("failed");
        setError("Card payments are not configured.");
        return;
      }

      setPaymentStatus("pending");
      setError(null);

      setTimeout(() => {
        setPaymentStatus("success");
        setTimeout(() => onSuccess?.(), 2000);
      }, 2000);
    } catch (error: any) {
      setPaymentStatus("failed");
      setError(error.message || "Card payment failed");
    }
  };

  const handlePayment = () => {
    switch (paymentMethod) {
      case "mpesa":
        handleMpesaPayment();
        break;
      case "airtel":
        handleAirtelPayment();
        break;
      case "card":
        handleCardPayment();
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment
        </CardTitle>
        <CardDescription>Choose your preferred payment method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Total</span>
            <span className="font-semibold text-lg">{formatKsh(order.priceTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span>{order.quantityOrdered} {order.listingSnapshot?.unit}</span>
          </div>
        </div>

        {error && (
          <AlertCard type="danger" title="Payment Error" message={error} />
        )}

        {paymentStatus === "idle" && (
          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mpesa" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                M-Pesa
              </TabsTrigger>
              <TabsTrigger value="airtel" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Airtel
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Card
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mpesa" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the phone number registered with M-Pesa
                </p>
              </div>
              <Button onClick={handleMpesaPayment} disabled={!phone.trim()} className="w-full">
                Pay with M-Pesa
              </Button>
            </TabsContent>

            <TabsContent value="airtel" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="airtel-phone">Airtel Money Phone Number</Label>
                <Input
                  id="airtel-phone"
                  type="tel"
                  placeholder="0734567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the phone number registered with Airtel Money
                </p>
              </div>
              <Button onClick={handleAirtelPayment} disabled={!phone.trim()} className="w-full">
                Pay with Airtel Money
              </Button>
            </TabsContent>

            <TabsContent value="card" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="card-name">Cardholder Name</Label>
                <Input
                  id="card-name"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails((prev) => ({ ...prev, number: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="card-expiry">Expiry (MM/YY)</Label>
                  <Input
                    id="card-expiry"
                    placeholder="12/25"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails((prev) => ({ ...prev, expiry: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="card-cvc">CVC</Label>
                  <Input
                    id="card-cvc"
                    placeholder="123"
                    value={cardDetails.cvc}
                    onChange={(e) => setCardDetails((prev) => ({ ...prev, cvc: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleCardPayment} className="w-full">
                Pay with Card
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {paymentStatus === "pending" && (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-semibold">Processing payment...</p>
              <p className="text-sm text-muted-foreground">
                {paymentMethod === "mpesa" && "Please check your phone and enter your M-Pesa PIN"}
                {paymentMethod === "airtel" && "Please check your phone and enter your Airtel Money PIN"}
                {paymentMethod === "card" && "Processing your card payment"}
              </p>
            </div>
          </div>
        )}

        {paymentStatus === "success" && (
          <AlertCard
            type="success"
            title="Payment Successful!"
            message="Your order has been confirmed and payment is being processed."
            icon={CheckCircle}
          />
        )}

        {paymentStatus === "failed" && (
          <AlertCard
            type="danger"
            title="Payment Failed"
            message={error || "There was an error processing your payment. Please try again."}
            icon={XCircle}
          />
        )}

        {onCancel && paymentStatus === "idle" && (
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
