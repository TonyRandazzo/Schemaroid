import express from 'express';
import { getConnections, createConnection, deleteConnection } from '../controllers/connectionController.js';
import { authenticate } from '../middleware/auth.js';
import { connectionCreateValidators, validate } from '../utils/validators.js';

const router = express.Router();
router.use(authenticate);

router.get('/schema/:schemaId', getConnections);
router.post('/', connectionCreateValidators, validate, createConnection);
router.delete('/:id', deleteConnection);

export default router;