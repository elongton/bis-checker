const express = require("express");
const {
  getFullGearJSON,
  getAllDocuments,
  updateSlot,
  replaceGearLibrary, 
  logAndUpdateSpec,
  getLogs
} = require("../controllers/gearController");

const router = express.Router();

router.get("/", getFullGearJSON);
router.get("/all", getAllDocuments);
router.get("/logs", getLogs);
router.put("/", logAndUpdateSpec);
// router.put("/", replaceGearLibrary);

router.put("/:class/:spec/:slot", updateSlot);

module.exports = router;
