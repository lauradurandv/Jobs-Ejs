const express = require("express");
const router = express.Router();
const {
  getAllJobs,
  editJob,
  updateJob,
  addJob,
  createJob,
  deleteJob,
} = require("../controllers/jobs");

//display jobs
router.get("/", getAllJobs);

//to get a specific job
router.get("/edit/:id", editJob);

//edit a job
router.post("/update/:id", updateJob);

//to go to page to add an expense
router.get("/newJob", addJob);

//to add a new job
router.post("/newJob", createJob);

//delete job
router.post("/delete/:id", deleteJob);

router.get("/");
module.exports = router;
