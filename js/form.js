document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');
    const submitBtn = document.getElementById('submitBtn');
    const inputs = form.querySelectorAll('input');
    const password = document.getElementById('pword');
    const confirmPassword = document.getElementById('cpword');
    const phoneInput = document.getElementById('pnum');

    function validatePasswords() {
        if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
            confirmPassword.classList.add('invalidStyle');
        } else {
            confirmPassword.setCustomValidity('');
        }
    }

    function validateField(field, f) {
        // special case: password match
        if (field === password || field === confirmPassword) {
            validatePasswords();
        }

        const isValid = field.checkValidity();

        if (!isValid) {
            field.classList.add('invalid');
            if(!f) field.classList.add('invalidStyle');
        } else {
            field.classList.remove('invalid');
            field.classList.remove('invalidStyle')
        }

        return isValid;
    }

    function validateForm() {
        let allValid = true;
        let final = true;
        inputs.forEach(input => {
        if (!validateField(input, final)) {
            allValid = false;
        }
        });

        submitBtn.disabled = !allValid;
    }

    phoneInput.addEventListener('input', () => {
        // Keep only digits
        let raw = phoneInput.value.replace(/\D/g, '');

        // Hard limit to 10 digits
        if (raw.length > 10) raw = raw.slice(0, 10);

        // Auto-format: 123-456-7890
        let formatted = raw;
        if (raw.length > 6) {
            formatted = `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
        } else if (raw.length > 3) {
            formatted = `${raw.slice(0, 3)} ${raw.slice(3)}`;
        }
        
        phoneInput.value = formatted;
    });

    // validate as the user types / tabs
    inputs.forEach(input => {
        input.addEventListener('input', () => {
        validateField(input);
        validateForm();
        });
    });

    // final check on submit
    form.addEventListener('submit', (e) => {
        validateForm();
        if (submitBtn.disabled) {
        e.preventDefault(); // block submission if form invalid
        }
    });
});
