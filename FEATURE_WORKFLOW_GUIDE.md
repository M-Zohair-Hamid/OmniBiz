# Feature Workflow Guide - View Buttons & Payment Completion

## 📋 Orders Page - View Order Details

### Workflow:
```
Orders Page Table
    ↓
[👁️ View] Button ← Click
    ↓
API: getOrder(order.id)
    ↓
Order Details Modal Opens
    ├─ Order Header
    │  ├─ Order ID: #123
    │  ├─ Order Number: ORD-001
    │  ├─ Date: 31/01/2026
    │  └─ Status: Pending
    │
    ├─ Buyer Information
    │  ├─ Company: ABC Corporation
    │  └─ ID: 5
    │
    ├─ Items List
    │  ├─ Item 1: Widget (Code: W001)
    │  │  ├─ Qty: 5
    │  │  └─ Total: ₨ 5,000
    │  └─ Item 2: Gadget (Code: G001)
    │     ├─ Qty: 3
    │     └─ Total: ₨ 3,000
    │
    ├─ Financial Summary
    │  ├─ Subtotal: ₨ 8,000
    │  ├─ Tax (5%): ₨ 400
    │  └─ Total: ₨ 8,400
    │
    ├─ Notes (if any)
    │
    └─ [Close] Button ← Click to exit
```

### Key Features:
✅ Complete order information at a glance  
✅ All items with quantities and prices  
✅ Automatic tax calculation display  
✅ Buyer information linked  
✅ Order notes visible  
✅ Glass morphism UI design  

---

## 💳 Payments Page - View & Complete Partial Payments

### View Payment Details:
```
Payments Table
    ↓
[👁️ View] Button ← Click
    ↓
API: getOrder(payment.order_id)
    ↓
Payment Details Modal Opens
    ├─ Payment Header
    │  ├─ Payment ID: #45
    │  ├─ Order #: ORD-001
    │  ├─ Date: 01/02/2026
    │  └─ Amount: ₨ 3,000
    │
    ├─ Payment Details
    │  ├─ Payment Method: 💵 Cash
    │  └─ Payment Type: ⚠️ Partial
    │
    ├─ Order Information
    │  ├─ Buyer: ABC Corporation
    │  ├─ Order Date: 31/01/2026
    │  ├─ Order Total: ₨ 8,400
    │  └─ Remaining Amount: ₨ 5,400 ← Shows balance due
    │
    ├─ Notes (if any)
    │
    └─ [❌ Conditional Button]
       ├─ IF payment_type = "full" ✅
       │  └─ No additional payment button
       │
       └─ IF payment_type = "partial" ⚠️
          └─ [💰 Record Additional Payment] ← Click
```

### Complete Partial Payment:
```
[💰 Record Additional Payment] Button
    ↓
Complete Payment Modal Opens
    ├─ Order Details (Display)
    │  ├─ Order: ORD-001
    │  ├─ Previous Payment: ₨ 3,000
    │  └─ Payment Type: ⚠️ Partial
    │
    ├─ User Input Fields
    │  ├─ Additional Amount
    │  │  └─ Input: "2,400" ← How much more to pay?
    │  │
    │  ├─ Payment Portion
    │  │  ├─ Option 1: ⚠️ Partial Payment
    │  │  │  (More payment expected later)
    │  │  │
    │  │  └─ Option 2: ✅ Full/Complete Payment
    │  │     (This completes the order)
    │  │
    │  ├─ Payment Method
    │  │  ├─ 💵 Cash
    │  │  ├─ 💳 Card
    │  │  ├─ 🏦 Bank Transfer
    │  │  └─ 📄 Cheque
    │  │
    │  ├─ Payment Date
    │  │  └─ Picker: 03/02/2026
    │  │
    │  └─ Notes (Optional)
    │     └─ Text: "Final payment received"
    │
    └─ [💳 Record Payment] Button ← Click
       ↓
       API: createPayment({
         order_id: 1,
         amount: 2400,
         payment_method: "cash",
         payment_type: "full",
         payment_date: "2026-02-03",
         notes: "Final payment received"
       })
       ↓
       Success Toast: "Payment recorded successfully!"
       ↓
       Modals Close
       ↓
       Payments Table Refreshes
       ↓
       New Payment Visible in Table:
       │ Order: ORD-001 | Buyer: ABC Corp | Amount: ₨2,400 | Method: Cash | Type: ✅ Full │
```

---

## 📊 Button Locations

### Orders Page:
```
╔═══════════════════════════════════════════════════════════════╗
║ Orders Table                                    [+ Order] 📄PDF║
╠═════════════╦═══════════╦════════╦═══════╦═════════════════════╣
║ Order #     ║ Buyer     ║ Date   ║ Total ║ Status    Actions   ║
╠═════════════╬═══════════╬════════╬═══════╬═════════════════════╣
║ ORD-001     ║ ABC Corp  ║ 01/02  ║ 8400  ║ Pending   [👁️View]  ║ ← NEW!
║             ║           ║        ║       ║           [Edit]    ║
║             ║           ║        ║       ║           [Delete]  ║
║             ║           ║        ║       ║           [Options] ║
╚═════════════╩═══════════╩════════╩═══════╩═════════════════════╝
```

### Payments Page:
```
╔══════════════════════════════════════════════════════════════════╗
║ Payments Table                                    [📄 PDF Export] ║
╠════════════╦═══════════╦════════╦═══════╦═══════╦═════════════════╣
║ Order #    ║ Buyer     ║ Date   ║ Amt   ║ Method║ Type  Actions   ║
╠════════════╬═══════════╬════════╬═══════╬═══════╬═════════════════╣
║ ORD-001    ║ ABC Corp  ║ 01/02  ║ 3000  ║ Cash  ║ Partial [👁️View]║ ← NEW!
║            ║           ║        ║       ║       ║         [Delete]║
╚════════════╩═══════════╩════════╩═══════╩═══════╩═════════════════╝
```

---

## 🎨 Modal Styling

### Orders Details Modal:
```
┌─────────────────────────────────────────────────────┐
│ 📋 Order Details                                    │
├─────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────┐   │
│ │ Order ID: #123    │ Order Number: ORD-001     │   │ Glass Card
│ │ Date: 31/01/2026  │ Status: Pending           │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌───────────────────────────────────────────────┐   │
│ │ 👤 Buyer Information                          │   │
│ │ Company: ABC Corporation                      │   │
│ │ ID: 5                                         │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌───────────────────────────────────────────────┐   │
│ │ 📦 Items                                      │   │
│ │ ├─ Widget (W001) - Qty: 5 - ₨ 5,000         │   │
│ │ └─ Gadget (G001) - Qty: 3 - ₨ 3,000         │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌───────────────────────────────────────────────┐   │
│ │ Subtotal: ₨ 8,000                           │   │
│ │ Tax (5%): ₨ 400                             │   │
│ │ Total: ₨ 8,400                              │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌──────────────────────┐                           │
│ │ [       Close        ] │                           │
│ └──────────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

### Payments Details Modal:
```
┌──────────────────────────────────────────────────┐
│ 💳 Payment Details                               │
├──────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐  │
│ │ Payment ID: #45  │ Order #: ORD-001       │  │ Glass Card
│ │ Date: 01/02/2026 │ Amount: ₨ 3,000       │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ┌────────────────────────────────────────────┐  │
│ │ Payment Method: 💵 Cash                    │  │
│ │ Payment Type: ⚠️ Partial                   │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ┌────────────────────────────────────────────┐  │
│ │ 📋 Order Information                       │  │
│ │ Buyer: ABC Corporation                    │  │
│ │ Order Date: 31/01/2026                    │  │
│ │ Order Total: ₨ 8,400                      │  │
│ │ Remaining Amount: ₨ 5,400 ←────────┐      │  │
│ └────────────────────────────────────────────┘  │
│                      Remaining Balance Shown!   │
│ ┌────────────────────────────────────────────┐  │
│ │ ⚠️ This payment is partial.                │  │
│ │ [💰 Record Additional Payment] ←───────┐   │  │
│ └────────────────────────────────────────────┘  │
│                     Shows only for partial      │
│ ┌────────────────────┐                         │
│ │ [     Close       ]│                         │
│ └────────────────────┘                         │
└──────────────────────────────────────────────────┘
```

### Complete Payment Modal:
```
┌──────────────────────────────────────┐
│ 💳 Record Additional Payment         │
├──────────────────────────────────────┤
│ Order: ORD-001                       │
│ Previous Payment: ₨ 3,000            │
│ Payment Type: ⚠️ Partial             │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Additional Amount               │  │
│ │ [          2400          ]      │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Payment Portion                 │  │
│ │ [▼ Partial Payment]             │  │
│ │ ├─ ⚠️ Partial Payment           │  │
│ │ └─ ✅ Full/Complete Payment  ←─┼─→ Select
│ └────────────────────────────────┘  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Payment Method                  │  │
│ │ [▼ Cash]                        │  │
│ │ ├─ 💵 Cash                      │  │
│ │ ├─ 💳 Card                      │  │
│ │ ├─ 🏦 Bank Transfer             │  │
│ │ └─ 📄 Cheque                    │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Payment Date                    │  │
│ │ [    2026-02-03    ]            │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Notes (Optional)                │  │
│ │ [  Final payment received    ]  │  │
│ │ [                              ]  │  │
│ └────────────────────────────────┘  │
│                                      │
│ [💳 Record Payment] [    Cancel   ]  │
└──────────────────────────────────────┘
```

---

## ✨ Color Codes

| Component | Color | Meaning |
|-----------|-------|---------|
| 👁️ View Button | Purple (from-purple-500) | View details |
| 💰 Complete Payment | Blue (from-blue-500) | Record payment |
| Order Total | Emerald (text-emerald-600) | Financial amount |
| Order Status | Yellow (bg-yellow-300) | Status indicator |
| Remaining Amount | Blue (text-blue-600) | Balance owed |
| Close Button | Red (from-red-500) | Close/Cancel |
| Partial Payment | Orange emoji ⚠️ | Incomplete |
| Full Payment | Green emoji ✅ | Complete |

---

## 🔄 Data Flow

### View Order → Complete Order Flow:
```
User clicks View → Modal shows details → User sees full picture
                   (All order info)
```

### View Payment → Complete Payment Flow:
```
User clicks View → Sees remaining amount → Click "Record Additional Payment"
                   ↓
                   Complete Payment modal → Fill form → Submit → New payment created
                   ↓                           ↓
                   Shows all payment    Selects method, amount, type
                   details & balance
```

---

## 🚀 Usage Tips

1. **For Orders:**
   - Click View to see complete order before processing
   - All items and prices visible in one place
   - Tax calculation shown clearly

2. **For Payments:**
   - View shows what's been paid and what's owed
   - For partial payments, you can record additional payments
   - Each additional payment creates a new record (not updating existing)
   - You can see full payment history for any order

3. **Best Practices:**
   - Always view before deleting to confirm details
   - When completing a partial payment, consider if there are more payments coming
   - Use descriptive notes for better tracking
   - Select correct payment method for accurate records

---

## ✅ Verification

- ✅ View buttons appear for all records
- ✅ Modals display complete information
- ✅ Partial payments show "Complete" button
- ✅ Full payments don't show "Complete" button
- ✅ New payments create new records
- ✅ Tables refresh after actions
- ✅ UI matches existing design
- ✅ All error cases handled with toasts

