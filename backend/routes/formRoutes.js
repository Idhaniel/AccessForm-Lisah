const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const nodemailer = require('nodemailer');

// Configure email transporter
const createTransporter = () => {
	return nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT || 587,
		secure: process.env.SMTP_SECURE === 'true',
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS
		},
		tls: {
			rejectUnauthorized: false
		}
	});
};

// Submit form route
router.post('/submit', async (req, res) => {
	const { firstName, lastName, email, holdsAssets, consent } = req.body;

	try {
		// Check if email already exists
		const existing = await pool.query(
			'SELECT id FROM early_access_submissions WHERE email = $1',
			[email]
		);

		if (existing.rows.length > 0) {
			return res.status(400).json({
				error: 'This email is already registered for early access'
			});
		}

		// Insert into database
		const result = await pool.query(
			`INSERT INTO early_access_submissions 
             (first_name, last_name, email, holds_assets, consent) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id`,
			[firstName, lastName, email, holdsAssets, consent]
		);

		const submissionId = result.rows[0].id;

		// Send confirmation email if SMTP is configured
		if (
			process.env.SMTP_HOST &&
			process.env.SMTP_USER &&
			process.env.SMTP_PASS
		) {
			try {
				const transporter = createTransporter();

				const mailOptions = {
					from: `"Lisah" <${
						process.env
							.SMTP_FROM ||
						process.env
							.SMTP_USER
					}>`,
					to: email,
					subject: 'Welcome to Lisah Early Access',
					html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #667eea;">Welcome to Lisah Early Access!</h2>
                            <p>Hello ${firstName},</p>
                            <p>Thank you for joining the Lisah early access waitlist. We're excited to have you on board!</p>
                            <p>We'll notify you as soon as we launch. In the meantime, here's what you can expect:</p>
                            <ul>
                                <li>Early access to our platform before public release</li>
                                <li>Exclusive insights and updates</li>
                                <li>Priority support</li>
                            </ul>
                            <p>If you have any questions, feel free to reply to this email.</p>
                            <p>Best regards,<br>The Lisah Team</p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                            <p style="font-size: 12px; color: #718096;">
                                © 2026 Lisah, Inc. All Rights Reserved.<br>
                                <a href="#" style="color: #667eea;">Privacy Policy</a> | 
                                <a href="#" style="color: #667eea;">Terms of Use</a>
                            </p>
                        </div>
                    `
				};

				await transporter.sendMail(mailOptions);

				// Update database to mark email as sent
				await pool.query(
					'UPDATE early_access_submissions SET email_sent = true, email_sent_at = CURRENT_TIMESTAMP WHERE id = $1',
					[submissionId]
				);

				console.log(
					`Confirmation email sent to ${email}`
				);
			} catch (emailError) {
				console.error(
					'Error sending email:',
					emailError
				);
				// Don't fail the submission if email fails
			}
		} else {
			console.log(
				'SMTP not configured, skipping email send'
			);
		}

		res.status(201).json({
			success: true,
			message: 'Successfully registered for early access',
			id: submissionId
		});
	} catch (error) {
		console.error('Database error:', error);
		res.status(500).json({
			error: 'Internal server error',
			details:
				process.env.NODE_ENV === 'development'
					? error.message
					: undefined
		});
	}
});

// Get all submissions (for admin purposes, add authentication in production)
router.get('/submissions', async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT id, first_name, last_name, email, holds_assets, consent, submitted_at, email_sent FROM early_access_submissions ORDER BY submitted_at DESC'
		);

		res.json({ submissions: result.rows });
	} catch (error) {
		console.error('Error fetching submissions:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;
