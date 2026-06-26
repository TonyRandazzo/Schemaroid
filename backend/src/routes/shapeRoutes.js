import express from 'express';
import { getShapes, createShape, updateShape, deleteShape } from '../controllers/shapeController.js';
import { authenticate } from '../middleware/auth.js';
import { shapeCreateValidators, shapeUpdateValidators, validate } from '../utils/validators.js';

const router = express.Router();
router.use(authenticate);

router.get('/schema/:schemaId', getShapes);
router.post('/', shapeCreateValidators, validate, createShape);
router.put('/:id', shapeUpdateValidators, validate, updateShape);
router.delete('/:id', deleteShape);

export default router;
