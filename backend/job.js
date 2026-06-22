const express = require('express');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/jobs
// @desc    Create a job - employers only
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ msg: 'Access denied. Employers only.' });
    }

    const { title, company, location, description, salary } = req.body;
    
    const newJob = new Job({
      title,
      company,
      location,
      description,
      salary,
      postedBy: req.user.id
    });

    const job = await newJob.save();
    res.json(job);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/jobs
// @desc    Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ date: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Job not found' });
    res.status(500).send('Server error');
  }
});

module.exports = router;