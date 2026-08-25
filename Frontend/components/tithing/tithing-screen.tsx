"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, Smartphone, Building, Receipt, Calendar, DollarSign } from "lucide-react"

export function TithingScreen() {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)

  // Mock tithing history
  const tithingHistory = [
    {
      id: 1,
      amount: 50000,
      date: "May 26, 2025",
      method: "Bank Transfer",
      status: "Completed",
      reference: "TH-2025-001",
    },
    {
      id: 2,
      amount: 50000,
      date: "April 28, 2025",
      method: "Card Payment",
      status: "Completed",
      reference: "TH-2025-002",
    },
    {
      id: 3,
      amount: 45000,
      date: "March 31, 2025",
      method: "USSD",
      status: "Completed",
      reference: "TH-2025-003",
    },
  ]

  const paymentMethods = [
    { id: "card", name: "Debit/Credit Card", icon: CreditCard },
    { id: "transfer", name: "Bank Transfer", icon: Building },
    { id: "ussd", name: "USSD Code", icon: Smartphone },
  ]

  const handlePayment = () => {
    if (!amount || !paymentMethod) return

    setIsPaymentDialogOpen(false)
    // Simulate payment processing
    setTimeout(() => {
      setIsReceiptDialogOpen(true)
    }, 1000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const totalGiving = tithingHistory.reduce((sum, record) => sum + record.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Tithing &amp; Donations</h1>
        <p className="text-muted-foreground">Give your tithes and offerings</p>
      </div>

      {/* Quick Give Card */}
      <Card className="bg-gradient-to-r from-church-gold/10 to-church-navy/10 border-church-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-church-gold" />
            Quick Give
          </CardTitle>
          <CardDescription>Make a quick tithe or offering</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[10000, 25000, 50000].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                onClick={() => {
                  setAmount(preset.toString())
                  setIsPaymentDialogOpen(true)
                }}
                className="h-12"
              >
                {formatCurrency(preset)}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setIsPaymentDialogOpen(true)}
            className="w-full bg-church-gold hover:bg-amber-400 text-church-navy"
          >
            Custom Amount
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="history">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {tithingHistory.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{formatCurrency(record.amount)}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {record.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        {record.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{record.method}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Giving Summary</CardTitle>
                <CardDescription>Your giving overview for 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Given</span>
                    <span className="text-2xl font-bold text-church-gold">{formatCurrency(totalGiving)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Number of Gifts</span>
                    <span className="font-semibold">{tithingHistory.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Gift</span>
                    <span className="font-semibold">{formatCurrency(totalGiving / tithingHistory.length)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["May", "April", "March"].map((month, index) => {
                    const monthAmount = tithingHistory[index]?.amount || 0
                    return (
                      <div key={month} className="flex justify-between items-center">
                        <span>{month} 2025</span>
                        <span className="font-semibold">{formatCurrency(monthAmount)}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>Choose your payment amount and method</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label>Payment Method</Label>
              <div className="grid gap-2 mt-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? "default" : "outline"}
                    className="justify-start h-12"
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <method.icon className="h-4 w-4 mr-2" />
                    {method.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!amount || !paymentMethod}
              className="bg-church-gold hover:bg-amber-400 text-church-navy"
            >
              Proceed to Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Successful!</DialogTitle>
            <DialogDescription>Your tithe has been received. Thank you for your giving!</DialogDescription>
          </DialogHeader>

          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-church-gold mb-2">{formatCurrency(Number(amount))}</p>
            <p className="text-sm text-muted-foreground">Reference: TH-2025-004</p>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsReceiptDialogOpen(false)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
