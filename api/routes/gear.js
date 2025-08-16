const express = require("express");
const {
  getFullGearJSON,
  getAllDocuments,
  updateSlot,
  replaceGearLibrary,
  logAndUpdateSpec,
} = require("../controllers/gearController");

const router = express.Router();

router.get("/", getFullGearJSON);
router.get("/all", getAllDocuments);
// router.put("/", replaceGearLibrary);
router.put('/', logAndUpdateSpec);

router.put("/:class/:spec/:slot", updateSlot);


module.exports = router;
