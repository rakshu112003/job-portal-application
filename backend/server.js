const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// DB CONNECT
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.log("MongoDB error ❌", err));

// MODEL
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String
});

const Job = mongoose.model("Job", jobSchema);

// ROOT
app.get("/", (req, res) => {
  res.send("Backend is alive 🚀");
});

// GET ALL JOBS
app.get("/api/jobs", async (req, res) => {
  const jobs = await Job.find();
  res.json(jobs);
});

// ADD JOB
app.post("/api/jobs", async (req, res) => {
  const job = new Job(req.body);
  const saved = await job.save();
  res.json(saved);
});

// UPDATE JOB
app.put("/api/jobs/:id", async (req, res) => {
  const updated = await Job.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

// DELETE JOB
app.delete("/api/jobs/:id", async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
});

// SAMPLE DATA (only first time)
const insertJobs = async () => {
  const count = await Job.countDocuments();
  if (count === 0) {
    await Job.insertMany([
      { title: "Software Engineer", company: "ABC Corp", location: "Bangalore", salary: "50k" },
      { title: "Data Scientist", company: "XYZ Inc", location: "Delhi", salary: "60k" }
    ]);
  }
};

insertJobs();

// START SERVER
const PORT = 5000;
app.listen(PORT, () => {
 console.log(`Server running on port ${PORT} ✅`);
});