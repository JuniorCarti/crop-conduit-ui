/**
 * Payment Checkout Component
 * Handles M-Pesa STK Push payment flow
 */

import { useState } from "react";
import { CreditCard, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCard } from "@/components/shared/AlertCard";
import { useInitiatePayment } from "../hooks/useMarketplace";
import { formatKsh } from "@/lib/currency";
import type { Order } from "../models/types";

interface PaymentCheckoutProps {
  order: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentCheckout({ order, onSuccess, onCancel }: PaymentCheckoutProps) {
  const [phone, setPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const initiatePayment = useInitiatePayment();

  const handlePayment = async () => {
    if (!phone.trim()) {
      return;
    }

    // Format phone number (ensure it starts with 254)
    let formattedPhone = phone.replace(/\s+/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    try {
      setPaymentStatus("pending");
      await initiatePayment.mutateAsync({
        orderId: order.id!,
        phone: formattedPhone,
        amount: order.priceTotal,
      });

      // In mock mode, payment completes immediately
      // In production, wait for callback
      if (import.meta.env.VITE_MPESA_MOCK_MODE === "true") {
        setTimeout(() => {
          setPaymentStatus("success");
          setTimeout(() => onSuccess?.(), 2000);
        }, 3000);
      } else {
        // In production, poll for payment status or wait for callback
        setPaymentStatus("pending");
      }
    } catch (error: any) {
      setPaymentStatus("failed");
      console.error("Payment error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Checkout
        </CardTitle>
        <CardDescription>Complete your order with M-Pesa</CardDescription>
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

        {paymentStatus === "idle" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the phone number registered with M-Pesa
              </p>
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button
                onClick={handlePayment}
                disabled={!phone.trim() || initiatePayment.isPending}
                className="flex-1"
              >
                {initiatePayment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay with M-Pesa
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {paymentStatus === "pending" && (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-semibold">Waiting for payment confirmation</p>
              <p className="text-sm text-muted-foreground">
                Please check your phone and enter your M-Pesa PIN
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
            message="There was an error processing your payment. Please try again."
            icon={XCircle}
          />
        )}
      </CardContent>
    </Card>
  );
}
