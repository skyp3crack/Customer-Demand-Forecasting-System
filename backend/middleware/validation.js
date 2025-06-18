/**
 * Validation Middleware
 * Provides request validation using a simple schema-based approach
 */

/**
 * Validates request data against defined rules
 * @param {Object} validations - Validation rules object
 * @returns {Function} Express middleware function
 */
const validateRequest = (validations) => {
    return async (req, res, next) => {
      try {
        await Promise.all(
          Object.entries(validations).map(([location, rules]) => {
            if (['body', 'params', 'query'].includes(location)) {
              return Promise.all(
                Object.entries(rules).map(([field, rule]) => {
                  // Check for required fields
                  if (rule.notEmpty || rule.isArray) {
                    if (rule.notEmpty) {
                      if (!req[location][field] || 
                          (Array.isArray(req[location][field]) && req[location][field].length === 0)) {
                        throw new Error(rule.errorMessage || `${field} is required`);
                      }
                    }
                    if (rule.isArray && !Array.isArray(req[location][field])) {
                      throw new Error(`${field} must be an array`);
                    }
                  }
                  
                  // Validate date format (ISO 8601)
                  if (rule.isISO8601 && req[location][field]) {
                    const date = new Date(req[location][field]);
                    if (isNaN(date.getTime())) {
                      throw new Error(rule.errorMessage || `${field} must be a valid date (YYYY-MM-DD)`);
                    }
                  }
                  
                  // Validate enum values
                  if (rule.isIn && req[location][field]) {
                    if (!rule.isIn.options.includes(req[location][field])) {
                      throw new Error(rule.errorMessage || 
                        `${field} must be one of: ${rule.isIn.options.join(', ')}`);
                    }
                  }
                  
                  // Add more validation rules as needed
                })
              );
            }
          })
        );
        next();
      } catch (error) {
        next(error); // Pass to error handler
      }
    };
  };
  
  /**
   * Error handling middleware for validation errors
   * Should be added after all routes but before the final error handler
   */
  const handleValidationErrors = (err, req, res, next) => {
    if (err instanceof Error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: err.message
      });
    }
    next(err);
  };
  
  module.exports = {
    validateRequest,
    handleValidationErrors
  };