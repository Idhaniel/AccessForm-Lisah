document.addEventListener('DOMContentLoaded', function () {
	// Mobile menu toggle
	const mobileMenuBtn = document.getElementById('mobileMenuBtn');
	const mobileMenu = document.getElementById('mobileMenu');

	if (mobileMenuBtn && mobileMenu) {
		mobileMenuBtn.addEventListener('click', function (e) {
			e.stopPropagation();
			mobileMenu.classList.toggle('active');
		});

		// Close menu when clicking outside
		document.addEventListener('click', function (event) {
			if (
				!mobileMenu.contains(event.target) &&
				!mobileMenuBtn.contains(event.target)
			) {
				mobileMenu.classList.remove('active');
			}
		});
	}

	// Form elements
	const form = document.getElementById('earlyAccessForm');
	const submitBtn = document.getElementById('submitBtn');
	const successMessage = document.getElementById('successMessage');

	// Form submission
	if (form) {
		form.addEventListener('submit', async function (e) {
			e.preventDefault();

			// Clear previous errors
			clearErrors();

			// Get form data
			const formData = {
				firstName: document
					.getElementById('firstName')
					.value.trim(),
				lastName: document
					.getElementById('lastName')
					.value.trim(),
				email: document
					.getElementById('email')
					.value.trim(),
				holdsAssets: document.querySelector(
					'input[name="holdsAssets"]:checked'
				)?.value,
				consent: document.querySelector(
					'input[name="consent"]:checked'
				)?.value
			};

			// Validate form
			let isValid = true;

			// Validate first name
			if (!formData.firstName) {
				showError(
					'firstNameError',
					'First name is required'
				);
				document.getElementById(
					'firstName'
				).classList.add('error');
				isValid = false;
			}

			// Validate last name
			if (!formData.lastName) {
				showError(
					'lastNameError',
					'Last name is required'
				);
				document.getElementById(
					'lastName'
				).classList.add('error');
				isValid = false;
			}

			// Validate email
			if (!formData.email) {
				showError(
					'emailError',
					'Email address is required'
				);
				document.getElementById(
					'email'
				).classList.add('error');
				isValid = false;
			} else if (!isValidEmail(formData.email)) {
				showError(
					'emailError',
					'Please enter a valid email address'
				);
				document.getElementById(
					'email'
				).classList.add('error');
				isValid = false;
			}

			// Validate radio buttons
			if (!formData.holdsAssets) {
				showError(
					'holdsAssetsError',
					'Please select an option'
				);
				isValid = false;
			}

			if (!formData.consent) {
				showError(
					'consentError',
					'Please select an option'
				);
				isValid = false;
			}

			if (!isValid) {
				return;
			}

			// Show loading state
			if (submitBtn) {
				submitBtn.classList.add('loading');
				submitBtn.innerHTML =
					'<span>SUBMITTING...</span>';
			}

			try {
				// Try to send to backend
				const backendUrl =
					'http://localhost:3000';

				const response = await fetch(
					`${backendUrl}/api/submit`,
					{
						method: 'POST',
						headers: {
							'Content-Type':
								'application/json'
						},
						body: JSON.stringify(
							formData
						)
					}
				);

				if (response.ok) {
					const result =
						await response.json();
					console.log(
						'Success:',
						result
					);

					// Show success message
					form.style.display = 'none';
					if (successMessage) {
						successMessage.classList.add(
							'active'
						);
					}

					// Reset form
					form.reset();
				} else {
					throw new Error(
						`Server error: ${response.status}`
					);
				}
			} catch (error) {
				console.log(
					'Using fallback simulation:',
					error.message
				);

				// For demo purposes, simulate success
				setTimeout(() => {
					form.style.display = 'none';
					if (successMessage) {
						successMessage.classList.add(
							'active'
						);
					}
					form.reset();
				}, 800);
			} finally {
				// Reset button state
				if (submitBtn) {
					submitBtn.classList.remove(
						'loading'
					);
					submitBtn.innerHTML =
						'<span>GET EARLY ACCESS NOTIFICATION</span>';
				}
			}
		});
	}

	// Helper functions
	function isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	function showError(elementId, message) {
		const element = document.getElementById(elementId);
		if (element) {
			element.textContent = message;
			element.classList.add('show');
		}
	}

	function clearErrors() {
		// Remove error classes
		document.querySelectorAll('.form-input.error').forEach(
			(el) => {
				el.classList.remove('error');
			}
		);

		// Clear error messages
		document.querySelectorAll('.error-message').forEach(
			(el) => {
				el.textContent = '';
				el.classList.remove('show');
			}
		);
	}

	// Real-time validation
	const inputs = document.querySelectorAll('.form-input');
	inputs.forEach((input) => {
		input.addEventListener('input', function () {
			this.classList.remove('error');
			const errorId = this.id + 'Error';
			const errorElement =
				document.getElementById(errorId);
			if (errorElement) {
				errorElement.textContent = '';
				errorElement.classList.remove('show');
			}
		});

		input.addEventListener('blur', function () {
			if (this.value.trim() === '') {
				this.classList.add('error');
				const errorId = this.id + 'Error';
				const errorElement =
					document.getElementById(
						errorId
					);
				if (errorElement) {
					errorElement.textContent =
						'This field is required';
					errorElement.classList.add(
						'show'
					);
				}
			}
		});
	});

	// Radio button validation
	const radioButtons = document.querySelectorAll('input[type="radio"]');
	radioButtons.forEach((radio) => {
		radio.addEventListener('change', function () {
			const name = this.name;
			const errorId = name + 'Error';
			const errorElement =
				document.getElementById(errorId);
			if (errorElement) {
				errorElement.textContent = '';
				errorElement.classList.remove('show');
			}
		});
	});

	// Test backend connection
	async function testBackendConnection() {
		try {
			const response = await fetch(
				'http://localhost:3000/api/health'
			);
			if (response.ok) {
				console.log(
					'✅ Backend connection successful'
				);
			}
		} catch (error) {
			console.log(
				'⚠️ Backend not reachable. Using fallback mode.'
			);
		}
	}

	// Test connection after page loads
	setTimeout(testBackendConnection, 1000);
});
