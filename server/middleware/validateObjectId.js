/**
 * validateObjectId Middleware — Rev.AI
 *
 * Checks that req.params.id is a valid MongoDB ObjectId before
 * the request reaches the controller. Returns a 400 immediately
 * if the format is wrong, preventing a Mongoose CastError downstream.
 */

const mongoose = require('mongoose');

/**
 * Express middleware that validates the `:id` route parameter.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid ID format: "${id}" is not a valid MongoDB ObjectId.`,
    });
  }

  next();
};

module.exports = validateObjectId;
