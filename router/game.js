const express = require('express');
const router = express.Router();
const Game = require('../model/gameModel');

//GET discovernew
router.get('/discovernew', async (req, res) => {
  try {
    const games = await Game.find({ type: 'Discover new' });
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

//GET weekcards

router.get('/Weekcards', async (req, res) => {
  try {
    const games = await Game.find({type: 'Week card'})
    res.json(games)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' })
  }
})

//GET Free game

router.get('/Freegame', async (req, res) => {
  try {
    const games = await Game.find({type: 'Free game'})
    res.json(games)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' })
  }
})

// GET epicextra
router.get('/epicextra', async (req, res) => {
  try {
    const games = await Game.find({ type: 'Epic extra' });
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

//GET topnew

router.get('/topnew', async (req, res) => {
  try {
    const games = await Game.find({type: 'Top new'})
    res.json(games)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' })
  }
})

//GET weekcard2

router.get('/weekcard2', async (req, res) => {
  try {
    const games = await Game.find({type: 'week Card2'})
    res.json(games)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' })
  }
})

//GET Top sellers

router.get('/Topsellers', async (req, res) => {
  try {
    const games = await Game.find({type: 'Top sellers'})
    res.json(games)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' })
  }
})

//GET Seven Knight

router.get('/Sevenknight', async (req, res) => {
  try {
    const games = await Game.find({type: 'Seven Knight'})
    res.json(games)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' })
  }
})


//GET Trending

router.get('/Trending', async(req, res) => {
  try {
    const games = await Game.find({type: 'Trending'})
    res.json(games)
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch games'})
  }
})

//GET New releases

router.get('/Newreleases', async(req, res) => {
  try {
    const games = await Game.find({type: 'New releases'})
    res.json(games)
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch games'})
  }
})

//GET Featured stories

router.get('/Featuredstories', async(req, res) => {
  try {
    const games = await Game.find({type: 'Featured stories'})
    res.json(games)
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch games'})
  }
})


//GET First run

router.get('/Firstrun', async(req, res) => {
  try {
    const games = await Game.find({type: 'First run'})
    res.json(games)
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch games'})
  }
})


//GET Top Adds-on

router.get('/Topadds', async(req, res) => {
  try {
    const games = await Game.find({type: 'Top Adds'})
    res.json(games)
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch games'})
  }
})

//GET Popular

router.get('/Popular', async(req, res) => {
  try {
    const game = await Game.find({type: 'Popular'})
    res.json(game)
  } catch (error) {
    res.status(500).json({error: 'Failed to fatch games:', error})
  }
})

//GET Recent

router.get('/Recent', async(req, res) => {
  try {
    const game = await Game.find({type: 'Recent'})
    res.json(game)
  } catch (error) {
    res.status(500).json({error: 'Failed to fatch games:', error})
  }
})

//GET Epic Store

router.get('/Epicstore', async(req, res) => {
  try {
    const game = await Game.find({type: 'Epic store'})
    res.json(game)
  } catch (error) {
    res.status(500).json({error: 'Failed to fatch games:', error})
  }
})

// GET single game by ID
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Game not found' });
  }
});

module.exports = router;