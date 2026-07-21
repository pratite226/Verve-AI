const BrandBrief = require("../models/BrandBrief");
const User = require("../models/User");
const { generateBrandBrief } = require("../services/aiService");

// @route POST /api/brand/generate
const generateBrand = async (req, res) => {
  try {
    const answers = req.body;

    const aiResult = await generateBrandBrief(answers);

    const brief = await BrandBrief.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, ...aiResult, rawAnswers: answers },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(req.user._id, {
      industry: answers.industry || "",
      careerStage: answers.careerStage || "",
      goals: answers.goal || "",
    });

    return res.status(201).json({
      success: true,
      message: "Brand Brief generated successfully",
      brief,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/brand
const getBrand = async (req, res) => {
  try {
    const brief = await BrandBrief.findOne({ userId: req.user._id });

    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found yet — generate one first",
      });
    }

    return res.status(200).json({ success: true, brief });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/brand
// Body: any subset of { positioning, tagline, tone, targetAudience, mission, contentPillars }
const updateBrand = async (req, res) => {
  try {
    const allowedFields = [
      "positioning",
      "tagline",
      "tone",
      "targetAudience",
      "mission",
      "contentPillars",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: `Provide at least one field to update: ${allowedFields.join(", ")}`,
      });
    }

    const brief = await BrandBrief.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true }
    );

    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found — generate one first",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brand Brief updated successfully",
      brief,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateBrand, getBrand, updateBrand };