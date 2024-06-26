import express from 'express';
const passport = require('passport');
import config from '../../config';
import { Request } from 'express';
import sessionController from '../controllers/sessionController';

// trying to add interface
interface UserReq extends Request {
  user: {
    id: string;
    username: string;
    googleId: string;
  };
}

const { API_BASE_URL2 } = config;
const router = express.Router();

/**
 * Route handler for initiating GitHub OAuth authentication. Redirects the user to GitHub OAuth login page.
 */
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['profile']
  })
);

/**
 * Route handler for handling GitHub OAuth callback. After successful authentication,
 * starts a session, sets session cookies, and redirects the user back to the specified base URL.
 *
 * @param {UserReq} req - The request object from Express extended with user information.
 * @param {express.Response} res - The response object from Express.
 */
router.get(
  '/github/callback',
  passport.authenticate('github'),
  sessionController.startSession,
  (req: UserReq, res) => {
    res.cookie('ssid', req.user.id, {
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });

    res.cookie('username', req.user.username, {
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });
    return res.redirect(API_BASE_URL2);
  }
);

/**
 * Route handler for initiating Google OAuth authentication. Redirects the user to Google OAuth login page.
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile']
  })
);

/**
 * Route handler for handling Google OAuth callback. After successful authentication,
 * starts a session, sets session cookies, and redirects the user back to the specified base URL.
 *
 * @param {UserReq} req - The request object from Express extended with user information.
 * @param {express.Response} res - The response object from Express.
 */
router.get(
  '/google/callback',
  passport.authenticate('google'),
  sessionController.startSession,
  (req: UserReq, res) => {
    res.cookie('ssid', req.user.id, {
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });

    res.cookie('username', req.user.username, {
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });
    return res.redirect(API_BASE_URL2);
  }
);

export default router;
