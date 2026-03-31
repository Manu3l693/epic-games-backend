const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

// ── ✅ FIX 1: Require Game model at the TOP, not inside the handler ──
// Since this file is in /router/, and your model is likely in /models/:
const Game = require('../model/gameModel');


// ══════════════════════════════════════════════
//  CART ITEM SCHEMA
// ══════════════════════════════════════════════
const CartItemSchema = new mongoose.Schema({
    userId:          { type: String, required: true },
    productId:       { type: String, required: true },
    name:            { type: String, required: true },
    image:           { type: String },
    price:           { type: Number, default: 0 },
    genre:           { type: String },
    arcLogo:         { type: String },
    productPlus:     { type: String },
    productUser:     { type: String },
    inGamePurchases: { type: Boolean, default: false },
    addedAt:         { type: Date, default: Date.now },
});

CartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

const CartItem = mongoose.models.CartItem || mongoose.model('CartItem', CartItemSchema);


// ══════════════════════════════════════════════
//  POST /api/cart/add
//  ✅ FIX 4: Named routes BEFORE /:userId wildcard
// ══════════════════════════════════════════════
router.post('/add', async (req, res) => {
    const { userId, productId } = req.body;

    console.log('🛒 Add to cart request:', { userId, productId });

    if (!userId || !productId) {
        return res.status(400).json({ message: 'userId and productId are required' });
    }

    try {
        const game = await Game.findById(productId);

        if (!game) {
            console.error('❌ Game not found for productId:', productId);
            return res.status(404).json({ message: 'Product not found' });
        }

        const existing = await CartItem.findOne({ userId, productId });
        if (existing) {
            return res.status(409).json({ message: 'Item already in cart' });
        }

        const newItem = await CartItem.create({
            userId,
            productId,
            name:            game.name    || game.header,
            image:           game.secondImage || game.thirdImage,
            price:           game.price,
            genre:           game.genre,
            arcLogo:         game.arcLogo,
            productPlus:     game.productPlus,
            productUser:     game.productUser,
            inGamePurchases: game.inGamePurchases || false,
        });

        console.log('✅ Item added to cart:', newItem.name);
        res.status(201).json({ success: true, item: newItem });

    } catch (err) {
        // ✅ FIX 2: Log the REAL error so you can see it in your terminal
        console.error('❌ Add to cart error:', err.message);
        res.status(500).json({ message: 'Failed to add to cart', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  POST /api/cart/merge
// ══════════════════════════════════════════════
router.post('/merge', async (req, res) => {
    const { userId, items } = req.body;

    if (!userId || !Array.isArray(items)) {
        return res.status(400).json({ message: 'userId and items array are required' });
    }

    try {
        for (const item of items) {
            await CartItem.updateOne(
                { userId, productId: item.productId || item.id },
                { $setOnInsert: {
                    userId,
                    productId:  item.productId || item.id,
                    name:       item.name,
                    image:      item.image,
                    price:      item.price,
                    genre:      item.genre,
                    addedAt:    new Date(),
                }},
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Cart merge error:', err.message);
        res.status(500).json({ message: 'Merge failed', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  GET /api/cart/:userId
//  ✅ FIX 4: Wildcard route AFTER named routes
// ══════════════════════════════════════════════
router.get('/:userId', async (req, res) => {
    try {
        const items = await CartItem.find({ userId: req.params.userId }).sort({ addedAt: -1 });
        res.json(items);
    } catch (err) {
        console.error('❌ Fetch cart error:', err.message);
        res.status(500).json({ message: 'Failed to fetch cart', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  DELETE /api/cart/:userId/:itemId
// ══════════════════════════════════════════════
router.delete('/:userId/:itemId', async (req, res) => {
    try {
        await CartItem.findOneAndDelete({
            _id:    req.params.itemId,
            userId: req.params.userId,
        });
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Remove item error:', err.message);
        res.status(500).json({ message: 'Failed to remove item', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  DELETE /api/cart/:userId
// ══════════════════════════════════════════════
router.delete('/:userId', async (req, res) => {
    try {
        await CartItem.deleteMany({ userId: req.params.userId });
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Clear cart error:', err.message);
        res.status(500).json({ message: 'Failed to clear cart', error: err.message });
    }
});


module.exports = router;
