import express from 'express';
import validate from '../middlewares/validate';
import { authController } from '../controllers';
import { authValidation } from '../validations';
import auth from '../middlewares/auth';

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
// router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

export default router;