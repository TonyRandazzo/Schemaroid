import express from 'express';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { projectValidators, validate } from '../utils/validators.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getProjects);
router.post('/', projectValidators, validate, createProject);
router.put('/:id', projectValidators, validate, updateProject);
router.delete('/:id', deleteProject);

export default router;