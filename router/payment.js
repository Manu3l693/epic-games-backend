// ================================================================
//  PAYMENT ROUTE — paste this into your existing app.js / server.js
//  or require it as a separate router file
// ================================================================
//
//  If using as a standalone router file:
//    const paymentRouter = require('./router/payment')
//    app.use('/api', paymentRouter)
//
//  Make sure you have these at the top of your app.js:
//    app.use(express.json())
//    app.use(cors({ origin: 'http://localhost:5173' }))
// ================================================================

const express = require('express')
const router  = express.Router()

// In-memory store — replace with your DB model in production
const orders = []

// ── POST /api/payment ─────────────────────────────────────────
router.post('/payment', (req, res) => {
    const { method, product, amount, creatorCode, emailConsent, card } = req.body

    // Basic field validation
    if (!method || !product || amount === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: method, product, amount.'
        })
    }

    // Card-specific validation
    if (method === 'card') {
        if (!card || !card.name || !card.last4 || !card.expiry) {
            return res.status(400).json({
                success: false,
                message: 'Invalid card details.'
            })
        }
    }

    // Build the order record
    const order = {
        id:           `ORD-${Date.now()}`,
        method,
        product,
        amount:       parseFloat(amount),
        creatorCode:  creatorCode || null,
        emailConsent: !!emailConsent,
        // Only store last 4 digits — never store full card numbers
        card:         method === 'card'
                        ? { name: card.name, last4: card.last4, expiry: card.expiry }
                        : null,
        status:       'confirmed',
        createdAt:    new Date().toISOString(),
    }

    orders.push(order)
    console.log(`[PAYMENT] ${order.id} | ${product} | $${amount} | via ${method}`)

    return res.status(200).json({
        success:  true,
        message:  'Payment processed successfully.',
        orderId:  order.id,
    })
})

// ── GET /api/orders ───────────────────────────────────────────
router.get('/orders', (req, res) => {
    return res.status(200).json({ success: true, orders })
})

// ── GET /api/orders/:id ───────────────────────────────────────
router.get('/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id)
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' })
    }
    return res.status(200).json({ success: true, order })
})

module.exports = router
