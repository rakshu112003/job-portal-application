const express = require("express");
const router = express.Router();
const Application = require("../models/Application");

router.post("/apply", async (req, res) => {
  try {
    const { jobId, userId, applicantName, applicantEmail } = req.body;
    
    if (!jobId || !userId || !applicantName || !applicantEmail) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Duplicate check
    const existing = await Application.findOne({ jobId, userId });
    if (existing) {
      return res.status(409).json({ message: "Already applied to this job" });
    }

    const application = new Application({
      jobId,
      userId, // frontend inda direct barutte, JWT beda
      applicantName,
      applicantEmail,
      resumeLink: req.body.resumeLink || ""
    });
    
    await application.save();

    res.status(201).json({
      message: "Applied Successfully",
      data: application
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Applied jobs list get maadoke - optional
router.get("/user/:userId", async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.params.userId }).populate('jobId');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;