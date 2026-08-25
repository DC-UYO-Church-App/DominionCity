import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { EmailService } from '../config/email';
import { renderWelcomeEmail } from '../templates/welcomeEmail';
import { renderPasswordResetEmail } from '../templates/passwordResetEmail';
import { renderPasswordChangedEmail } from '../templates/passwordChangedEmail';
import { PasswordResetService } from '../services/passwordResetService';
import { replyWithError } from '../utils/apiError';

/** Kept in step with PasswordResetService's TTL, for the copy in the email. */
const RESET_LINK_TTL_MINUTES = 60;
const MIN_PASSWORD_LENGTH = 8;

export class AuthController {
  static async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, password, firstName, lastName, phoneNumber, dateOfBirth, address } =
        request.body as any;

      const missingFields = Object.entries({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
      })
        .filter(([, value]) => !value || String(value).trim() === '')
        .map(([field]) => field);

      if (missingFields.length > 0) {
        return reply.status(400).send({
          error: `Missing required ${missingFields.length === 1 ? 'field' : 'fields'}: ${missingFields.join(', ')}`,
          fields: missingFields,
        });
      }

      const existingUser = await UserService.getUserByEmail(email);
      if (existingUser) {
        return reply.status(409).send({ error: 'Email already registered' });
      }

      const user = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address,
      });

      try {
        const welcome = renderWelcomeEmail({ firstName: user.firstName });
        await EmailService.send({
          to: user.email,
          subject: welcome.subject,
          html: welcome.html,
          text: welcome.text,
        });
      } catch (error) {
        // A failed welcome email must not fail the registration itself.
        console.error('Welcome email failed:', error);
      }

      const token = request.server.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      reply.status(201).send({ user, token });
    } catch (error) {
      replyWithError(reply, 'Registration failed', error);
    }
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, phoneNumber, identifier, password } = request.body as any;

      const loginIdentifier = identifier || phoneNumber || email;
      if (!loginIdentifier || !password) {
        return reply.status(400).send({ error: 'Identifier and password are required' });
      }

      const user = await UserService.validateCredentialsWithIdentifier(loginIdentifier, password);

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const token = request.server.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      reply.send({ user, token });
    } catch (error) {
      replyWithError(reply, 'Login failed', error);
    }
  }

  static async getProfile(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const user = await UserService.getUserById(request.user!.id);

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      reply.send({ user });
    } catch (error) {
      replyWithError(reply, 'Failed to get profile', error);
    }
  }

  static async updateProfile(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const updates = request.body as any;
      const userId = request.user!.id;

      const user = await UserService.updateUser(userId, updates);

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      reply.send({ user });
    } catch (error) {
      replyWithError(reply, 'Failed to update profile', error);
    }
  }

  static async uploadProfileImage(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const fileRequest = request as FastifyRequest & {
        file: () => Promise<{
          filename: string;
          mimetype: string;
          file: NodeJS.ReadableStream;
        }>;
      };

      const file = await fileRequest.file();
      if (!file) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.mimetype)) {
        return reply.status(400).send({ error: 'Only JPG or PNG images are allowed' });
      }

      await fs.mkdir(config.upload.dir, { recursive: true });

      const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${request.user!.id}-${Date.now()}-${safeName}`;
      const filePath = path.join(config.upload.dir, filename);

      const chunks: Buffer[] = [];
      for await (const chunk of file.file) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      await fs.writeFile(filePath, Buffer.concat(chunks));

      const imageUrl = `/uploads/${filename}`;
      const user = await UserService.updateUser(request.user!.id, { profileImage: imageUrl });

      reply.send({ user, imageUrl });
    } catch (error) {
      replyWithError(reply, 'Failed to upload profile image', error);
    }
  }

  /**
   * Starts a password reset.
   *
   * The response is deliberately identical whether or not the address belongs
   * to an account, and whether or not the per-account throttle was hit — an
   * attacker must not be able to use this endpoint to discover who has an
   * account here.
   */
  static async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    // Said in every branch below, so the caller learns nothing from the reply.
    const acknowledgement = {
      message:
        'If that email address has an account, a reset link is on its way. ' +
        'Check your inbox, and your spam folder.',
    };

    try {
      const { email } = request.body as { email?: string };

      if (!email || String(email).trim() === '') {
        return reply.status(400).send({ error: 'Email is required' });
      }

      const user = await UserService.getUserByEmailInsensitive(String(email).trim());
      // A deactivated account gets the same neutral reply, but no link.
      if (!user || !user.isActive) {
        return reply.send(acknowledgement);
      }

      const issued = await PasswordResetService.issueToken(user.id, request.ip);
      if (!issued) {
        // Throttled. Still a plain acknowledgement, for the reason above.
        return reply.send(acknowledgement);
      }

      const appUrl = config.cors.origin.replace(/\/$/, '');
      const resetUrl = `${appUrl}/reset-password?token=${issued.token}`;

      const message = renderPasswordResetEmail({
        firstName: user.firstName,
        resetUrl,
        expiresInMinutes: RESET_LINK_TTL_MINUTES,
      });

      await EmailService.send({
        to: user.email,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      reply.send(acknowledgement);
    } catch (error) {
      // A send failure is logged, but the caller still gets the neutral reply:
      // distinguishing it would leak that the address exists.
      console.error('Password reset request failed:', error);
      reply.send(acknowledgement);
    }
  }

  /** Redeems a reset token and sets the new password. */
  static async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token, password } = request.body as { token?: string; password?: string };

      if (!token || !password) {
        return reply.status(400).send({ error: 'Token and password are required' });
      }

      if (String(password).length < MIN_PASSWORD_LENGTH) {
        return reply.status(400).send({
          error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        });
      }

      const result = await PasswordResetService.consumeTokenAndSetPassword(
        String(token),
        String(password)
      );

      if (!result) {
        return reply.status(400).send({
          error: 'That reset link is invalid or has expired. Please request a new one.',
        });
      }

      const user = await UserService.getUserById(result.userId);

      if (user) {
        try {
          const message = renderPasswordChangedEmail({
            firstName: user.firstName,
            changedAt: new Date(),
          });
          await EmailService.send({
            to: user.email,
            subject: message.subject,
            html: message.html,
            text: message.text,
          });
        } catch (error) {
          // The password is already changed; a failed notice must not undo it.
          console.error('Password changed notification failed:', error);
        }
      }

      reply.send({ message: 'Your password has been updated. You can now sign in.' });
    } catch (error) {
      replyWithError(reply, 'Password reset failed', error);
    }
  }

  /**
   * Lets the reset page tell a good link from a stale one before asking the
   * visitor to type a new password twice for nothing.
   */
  static async verifyResetToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token } = request.query as { token?: string };

      if (!token) {
        return reply.status(400).send({ error: 'Token is required' });
      }

      const found = await PasswordResetService.findValidToken(String(token));
      reply.send({ valid: Boolean(found) });
    } catch (error) {
      replyWithError(reply, 'Could not verify reset token', error);
    }
  }
}
