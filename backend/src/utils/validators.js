import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

export const projectValidators = [
  body('name').isLength({ min: 1, max: 100 }).withMessage('Name required'),
];

export const schemaValidators = [
  body('name').isLength({ min: 1, max: 100 }).withMessage('Name required'),
  body('projectId').isUUID().withMessage('Invalid project id'),
];

export const schemaUpdateValidators = [
  body('name').isLength({ min: 1, max: 100 }).withMessage('Name required'),
];

const shapeOptionalFields = [
  body('title').optional().isLength({ max: 200 }),
  body('description').optional().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9a-f]{6}$/i),
  body('text_color').optional().matches(/^#[0-9a-f]{6}$/i),
  body('width').optional().isFloat(),
  body('height').optional().isFloat(),
  body('hyperlink').optional({ checkFalsy: true }).isLength({ max: 500 }),
  body('image_url').optional({ checkFalsy: true }).isURL(),
  body('shape_type').optional().isIn(['rectangle', 'square', 'circle', 'diamond', 'triangle', 'comment']),
];

export const shapeCreateValidators = [
  body('schemaId').isUUID(),
  body('x').isFloat(),
  body('y').isFloat(),
  ...shapeOptionalFields,
];

export const shapeUpdateValidators = [
  body('x').optional().isFloat(),
  body('y').optional().isFloat(),
  ...shapeOptionalFields,
];

const HANDLES = ['top', 'right', 'bottom', 'left'];

export const connectionCreateValidators = [
  body('schemaId').isUUID(),
  body('source_shape_id').isUUID(),
  body('target_shape_id').isUUID(),
  body('label').optional({ checkFalsy: true }).isLength({ max: 200 }),
  body('source_handle').optional({ checkFalsy: true }).isIn(HANDLES),
  body('target_handle').optional({ checkFalsy: true }).isIn(HANDLES),
];