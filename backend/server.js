const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration - Allow both localhost and 127.0.0.1
app.use(
	cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);

			// Allow localhost on any port, 127.0.0.1 on any port, and your production domain
			const allowedOrigins = [
				/^http:\/\/localhost(:\d+)?$/,
				/^http:\/\/127\.0\.0\.1(:\d+)?$/,
				/^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // Allow local network
				process.env.FRONTEND_URL
			].filter(Boolean);

			if (
				allowedOrigins.some((pattern) => {
					if (
						pattern instanceof
						RegExp
					) {
						return pattern.test(
							origin
						);
					}
					return pattern === origin;
				})
			) {
				return callback(null, true);
			}

			return callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
	})
);

// Handle preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
const { pool, initializeDatabase } = require('./database');

// Test route
app.get('/api/health', (req, res) => {
	res.json({
		status: 'ok',
		message: 'Server is running',
		timestamp: new Date().toISOString()
	});
});

// Import routes
const formRoutes = require('./routes/formRoutes');
app.use('/api', formRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
	const path = require('path');
	app.use(express.static(path.join(__dirname, '../frontend')));

	app.get('*', (req, res) => {
		res.sendFile(
			path.join(__dirname, '../frontend', 'index.html')
		);
	});
}

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Server error:', err.message);
	res.status(err.status || 500).json({
		error: err.message || 'Internal server error',
		details:
			process.env.NODE_ENV === 'development'
				? err.stack
				: undefined
	});
});

// Initialize database and start server
initializeDatabase()
	.then(() => {
		app.listen(PORT, '0.0.0.0', () => {
			console.log(
				`✅ Server running on http://localhost:${PORT}`
			);
			console.log(
				`🌐 Frontend should be accessible from:`
			);
			console.log(`   - http://localhost:5633`);
			console.log(`   - http://127.0.0.1:5633`);
			console.log(
				`📡 Health check: http://localhost:${PORT}/api/health`
			);
		});
	})
	.catch((err) => {
		console.error('❌ Failed to initialize database:', err);
		process.exit(1);
	});
