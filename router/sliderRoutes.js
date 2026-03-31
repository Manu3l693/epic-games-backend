// sliderRoutes.js — mount with: app.use('/api/slider', sliderRouter)

const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');

const Game = require('../model/gameModel');

// ══════════════════════════════════════════════
//  SLIDER SCHEMA
//  Stores the 6 featured games for the homepage
//  slider in order. One document per slot (0-5).
// ══════════════════════════════════════════════
const SliderItemSchema = new mongoose.Schema({
    order:     { type: Number, required: true, unique: true }, // 0-5
    gameId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    updatedAt: { type: Date, default: Date.now },
});

const SliderItem = mongoose.models.SliderItem || mongoose.model('SliderItem', SliderItemSchema);


// ══════════════════════════════════════════════
//  GET /api/slider
//  Returns the 6 featured games in order,
//  populated with full game data
// ══════════════════════════════════════════════
router.get('/', async (req, res) => {
    try {
        const sliderItems = await SliderItem
            .find()
            .sort({ order: 1 })
            .populate('gameId');

        if (!sliderItems || sliderItems.length === 0) {
            // ── Fallback: return first 6 games if slider not configured ──
            console.warn('⚠️  No slider items configured. Returning first 6 games as fallback.');
            const games = await Game.find().limit(6);
            return res.json(games);
        }

        // Return the populated game objects in order
        const games = sliderItems.map(item => item.gameId);
        res.json(games);

    } catch (err) {
        console.error('❌ Fetch slider error:', err.message);
        res.status(500).json({ message: 'Failed to fetch slider games', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  POST /api/slider/seed
//  One-time setup: assign games to slider slots
//  by name. Call this once from Postman/Thunder
//  Client to configure your slider.
//
//  Body: { games: ['Crimson Desert', 'Out of Words', ...] }
//  (6 names in the order you want them displayed)
// ══════════════════════════════════════════════
router.post('/seed', async (req, res) => {
    const { games: gameNames } = req.body;

    if (!Array.isArray(gameNames) || gameNames.length !== 6) {
        return res.status(400).json({ message: 'Provide exactly 6 game names in order.' });
    }

    try {
        const results = [];

        for (let i = 0; i < gameNames.length; i++) {
            const searchName = gameNames[i];

            // Find the game by name or header (case-insensitive)
            const game = await Game.findOne({
                $or: [
                    { name:   { $regex: searchName, $options: 'i' } },
                    { header: { $regex: searchName, $options: 'i' } },
                ]
            });

            if (!game) {
                console.warn(`⚠️  Game not found: "${searchName}"`);
                results.push({ order: i, name: searchName, status: 'not found' });
                continue;
            }

            // Upsert — update if exists, insert if not
            await SliderItem.findOneAndUpdate(
                { order: i },
                { order: i, gameId: game._id, updatedAt: new Date() },
                { upsert: true, new: true }
            );

            results.push({ order: i, name: game.name || game.header, id: game._id, status: 'ok' });
        }

        console.log('✅ Slider seeded:', results);
        res.json({ success: true, results });

    } catch (err) {
        console.error('❌ Slider seed error:', err.message);
        res.status(500).json({ message: 'Failed to seed slider', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  PUT /api/slider/:order
//  Update a single slider slot (0-5) by game name
//
//  Body: { gameName: 'Battlefield 6' }
// ══════════════════════════════════════════════
router.put('/:order', async (req, res) => {
    const order    = parseInt(req.params.order);
    const { gameName } = req.body;

    if (isNaN(order) || order < 0 || order > 5) {
        return res.status(400).json({ message: 'Order must be a number between 0 and 5.' });
    }

    try {
        const game = await Game.findOne({
            $or: [
                { name:   { $regex: gameName, $options: 'i' } },
                { header: { $regex: gameName, $options: 'i' } },
            ]
        });

        if (!game) return res.status(404).json({ message: `Game "${gameName}" not found.` });

        await SliderItem.findOneAndUpdate(
            { order },
            { order, gameId: game._id, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        console.log(`✅ Slider slot ${order} updated to: ${game.name || game.header}`);
        res.json({ success: true, order, game: game.name || game.header, id: game._id });

    } catch (err) {
        console.error('❌ Slider update error:', err.message);
        res.status(500).json({ message: 'Failed to update slider slot', error: err.message });
    }
});


module.exports = router;
