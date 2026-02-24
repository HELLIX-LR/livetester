// Tester Registration Module

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessageBox = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous messages
        clearMessages();
        clearFieldErrors();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Get form data
        const formData = getFormData();
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        
        try {
            // Submit registration
            const response = await api.post('/api/testers', formData);
            
            if (response.success) {
                // Show success message
                showSuccess();
                
                // Reset form
                form.reset();
                
                // Re-enable button after delay
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
                }, 3000);
            } else {
                throw new Error(response.error?.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError(error.message || 'Registration failed. Please try again.');
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
        }
    });
    
    // Real-time validation
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const deviceTypeSelect = document.getElementById('deviceType');
    const osSelect = document.getElementById('os');
    
    nameInput.addEventListener('blur', () => validateName());
    emailInput.addEventListener('blur', () => validateEmail());
    deviceTypeSelect.addEventListener('change', () => validateDeviceType());
    osSelect.addEventListener('change', () => validateOS());
});

/**
 * Get form data
 */
function getFormData() {
    return {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        nickname: document.getElementById('nickname').value.trim() || null,
        telegram: document.getElementById('telegram').value.trim() || null,
        deviceType: document.getElementById('deviceType').value,
        os: document.getElementById('os').value,
        osVersion: document.getElementById('osVersion').value.trim() || null
    };
}

/**
 * Validate entire form
 */
function validateForm() {
    let isValid = true;
    
    if (!validateName()) isValid = false;
    if (!validateEmail()) isValid = false;
    if (!validateDeviceType()) isValid = false;
    if (!validateOS()) isValid = false;
    
    return isValid;
}

/**
 * Validate name
 */
function validateName() {
    const nameInput = document.getElementById('name');
    const nameError = document.getElementById('nameError');
    const name = nameInput.value.trim();
    
    if (!name) {
        showFieldError(nameError, 'Name is required');
        return false;
    }
    
    if (name.length < 2) {
        showFieldError(nameError, 'Name must be at least 2 characters');
        return false;
    }
    
    if (name.length > 255) {
        showFieldError(nameError, 'Name must be less than 255 characters');
        return false;
    }
    
    clearFieldError(nameError);
    return true;
}

/**
 * Validate email
 */
function validateEmail() {
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const email = emailInput.value.trim();
    
    if (!email) {
        showFieldError(emailError, 'Email is required');
        return false;
    }
    
    // Email regex pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showFieldError(emailError, 'Please enter a valid email address');
        return false;
    }
    
    clearFieldError(emailError);
    return true;
}

/**
 * Validate device type
 */
function validateDeviceType() {
    const deviceTypeSelect = document.getElementById('deviceType');
    const deviceTypeError = document.getElementById('deviceTypeError');
    const deviceType = deviceTypeSelect.value;
    
    if (!deviceType) {
        showFieldError(deviceTypeError, 'Device type is required');
        return false;
    }
    
    clearFieldError(deviceTypeError);
    return true;
}

/**
 * Validate OS
 */
function validateOS() {
    const osSelect = document.getElementById('os');
    const osError = document.getElementById('osError');
    const os = osSelect.value;
    
    if (!os) {
        showFieldError(osError, 'Operating system is required');
        return false;
    }
    
    clearFieldError(osError);
    return true;
}

/**
 * Show field error
 */
function showFieldError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.parentElement.classList.add('has-error');
}

/**
 * Clear field error
 */
function clearFieldError(errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
    errorElement.parentElement.classList.remove('has-error');
}

/**
 * Clear all field errors
 */
function clearFieldErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.classList.remove('has-error');
    });
}

/**
 * Show success message
 */
function showSuccess() {
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 5000);
}

/**
 * Show error message
 */
function showError(message) {
    const errorMessageBox = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorMessageBox.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorMessageBox.style.display = 'none';
    }, 5000);
}

/**
 * Clear all messages
 */
function clearMessages() {
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}
