const express  = require('express');
const router   = require('express').Router();
const mongoose = require('mongoose');

const Game = require('../model/gameModel');


// ══════════════════════════════════════════════
//  WISHLIST ITEM SCHEMA
// ══════════════════════════════════════════════
const WishlistItemSchema = new mongoose.Schema({
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

// Prevent duplicate items per user
WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

const WishlistItem = mongoose.models.WishlistItem || mongoose.model('WishlistItem', WishlistItemSchema);


// ══════════════════════════════════════════════
//  POST /api/wishlist/add  →  add item
//  Named routes BEFORE /:userId wildcard
// ══════════════════════════════════════════════
router.post('/add', async (req, res) => {
    const { userId, productId } = req.body;

    console.log('❤️  Add to wishlist request:', { userId, productId });

    if (!userId || !productId) {
        return res.status(400).json({ message: 'userId and productId are required' });
    }

    try {
        const game = await Game.findById(productId);

        if (!game) {
            console.error('❌ Game not found for productId:', productId);
            return res.status(404).json({ message: 'Product not found' });
        }

        // Already in wishlist — return 409 so frontend marks it as added
        const existing = await WishlistItem.findOne({ userId, productId });
        if (existing) {
            return res.status(409).json({ message: 'Item already in wishlist' });
        }

        const newItem = await WishlistItem.create({
            userId,
            productId,
            name:            game.name || game.header,
            image:           game.secondImage || game.thirdImage,
            price:           game.price,
            genre:           game.genre,
            arcLogo:         game.arcLogo,
            productPlus:     game.productPlus,
            productUser:     game.productUser,
            inGamePurchases: game.inGamePurchases || false,
        });

        console.log('✅ Item added to wishlist:', newItem.name);
        res.status(201).json({ success: true, item: newItem });

    } catch (err) {
        console.error('❌ Add to wishlist error:', err.message);
        res.status(500).json({ message: 'Failed to add to wishlist', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  GET /api/wishlist/:userId  →  fetch wishlist
//  Wildcard route AFTER named routes
// ══════════════════════════════════════════════
router.get('/:userId', async (req, res) => {
    try {
        const items = await WishlistItem.find({ userId: req.params.userId }).sort({ addedAt: -1 });
        res.json(items);
    } catch (err) {
        console.error('❌ Fetch wishlist error:', err.message);
        res.status(500).json({ message: 'Failed to fetch wishlist', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  DELETE /api/wishlist/:userId/:itemId  →  remove one item
// ══════════════════════════════════════════════
router.delete('/:userId/:itemId', async (req, res) => {
    try {
        await WishlistItem.findOneAndDelete({
            _id:    req.params.itemId,
            userId: req.params.userId,
        });
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Remove wishlist item error:', err.message);
        res.status(500).json({ message: 'Failed to remove item', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  DELETE /api/wishlist/:userId  →  clear entire wishlist
// ══════════════════════════════════════════════
router.delete('/:userId', async (req, res) => {
    try {
        await WishlistItem.deleteMany({ userId: req.params.userId });
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Clear wishlist error:', err.message);
        res.status(500).json({ message: 'Failed to clear wishlist', error: err.message });
    }
});


module.exports = router;
