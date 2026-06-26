import express from 'express';
import { getSchemas, createSchema, updateSchema, deleteSchema } from '../controllers/schemaController.js';
import { authenticate } from '../middleware/auth.js';
import { schemaValidators, schemaUpdateValidators, validate } from '../utils/validators.js';

const router = express.Router();
router.use(authenticate);

router.get('/project/:projectId', getSchemas);
router.post('/', schemaValidators, validate, createSchema);
router.put('/:id', schemaUpdateValidators, validate, updateSchema);
router.delete('/:id', deleteSchema);

export default router;
