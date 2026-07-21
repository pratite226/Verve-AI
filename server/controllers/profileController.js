const BrandBrief = require("../models/BrandBrief");
const { generateProfileOptimization } = require("../services/aiService");

// @route POST /api/profile/optimize
// Body: { "currentHeadline": "...", "currentAbout": "..." }
const optimizeProfile = async (req, res) => {
  try {
    const { currentHeadline, currentAbout } = req.body;

    if (!currentHeadline && !currentAbout) {
      return res.status(400).json({
        success: false,
        message: "Provide at least currentHeadline or currentAbout",
      });
    }

    const brief = await BrandBrief.findOne({ userId: req.user._id });
    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found — complete onboarding first",
      });
    }

    const result = await generateProfileOptimization(brief, currentHeadline, currentAbout);

    return res.status(200).json({
      success: true,
      message: "Profile optimized successfully",
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { optimizeProfile };