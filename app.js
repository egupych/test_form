document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const successMessage = document.getElementById('success-message');

    // Получаем поля для валидации
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const taskInput = document.getElementById('task');

    // Функция для отображения ошибки
    const showError = (input, message) => {
        const formGroup = input.parentElement;
        const errorDisplay = formGroup.querySelector('.error-message');

        input.classList.add('error');
        errorDisplay.textContent = message;
        errorDisplay.classList.add('show');
    };

    // Функция для скрытия ошибки
    const showSuccess = (input) => {
        const formGroup = input.parentElement;
        const errorDisplay = formGroup.querySelector('.error-message');

        input.classList.remove('error');
        errorDisplay.textContent = '';
        errorDisplay.classList.remove('show');
    };

    // Улучшенная функция для проверки email
    const validateEmail = (email) => {
        // Более строгая проверка email
        const re = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase().trim());
    };
    
    // Улучшенная функция для проверки телефона
    const validatePhone = (phone) => {
        // Удаляем все пробелы, дефисы и скобки для проверки
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Проверяем различные форматы:
        // +7XXXXXXXXXX, 8XXXXXXXXXX, 7XXXXXXXXXX (для России/Казахстана)
        // +XXX... (международный формат)
        const patterns = [
            /^\+7[0-9]{10}$/, // +7XXXXXXXXXX
            /^8[0-9]{10}$/,   // 8XXXXXXXXXX
            /^7[0-9]{10}$/,   // 7XXXXXXXXXX
            /^\+[1-9][0-9]{7,14}$/ // Международный формат
        ];
        
        return patterns.some(pattern => pattern.test(cleanPhone));
    };

    // Функция форматирования телефона во время ввода
    const formatPhoneInput = (input) => {
        let value = input.value.replace(/\D/g, ''); // Удаляем все нецифровые символы
        
        if (value.length > 0) {
            if (value.startsWith('8')) {
                // Заменяем 8 на +7
                value = '7' + value.slice(1);
            }
            
            if (value.startsWith('7')) {
                value = '+7' + value.slice(1);
            } else if (!value.startsWith('+')) {
                value = '+' + value;
            }
            
            // Форматируем российский номер
            if (value.startsWith('+7') && value.length > 2) {
                const digits = value.slice(2);
                if (digits.length <= 3) {
                    value = '+7 (' + digits;
                } else if (digits.length <= 6) {
                    value = '+7 (' + digits.slice(0, 3) + ') ' + digits.slice(3);
                } else if (digits.length <= 8) {
                    value = '+7 (' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
                } else {
                    value = '+7 (' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6, 8) + '-' + digits.slice(8, 10);
                }
            }
        }
        
        input.value = value;
    };

    // Добавляем форматирование телефона при вводе
    phoneInput.addEventListener('input', function() {
        formatPhoneInput(this);
    });

    // Валидация в реальном времени
    const inputs = [nameInput, phoneInput, emailInput, taskInput];
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });

    // Функция валидации отдельного поля
    const validateField = (input) => {
        const value = input.value.trim();
        
        switch(input.id) {
            case 'name':
                if (value === '') {
                    showError(input, 'Пожалуйста, введите ваше имя');
                    return false;
                } else if (value.length < 2) {
                    showError(input, 'Имя должно содержать минимум 2 символа');
                    return false;
                } else {
                    showSuccess(input);
                    return true;
                }
                
            case 'phone':
                if (value === '') {
                    showError(input, 'Пожалуйста, введите номер телефона');
                    return false;
                } else if (!validatePhone(value)) {
                    showError(input, 'Введите корректный номер телефона');
                    return false;
                } else {
                    showSuccess(input);
                    return true;
                }
                
            case 'email':
                if (value === '') {
                    showError(input, 'Пожалуйста, введите email адрес');
                    return false;
                } else if (!validateEmail(value)) {
                    showError(input, 'Введите корректный email адрес');
                    return false;
                } else {
                    showSuccess(input);
                    return true;
                }
                
            case 'task':
                if (value === '') {
                    showError(input, 'Пожалуйста, опишите задачу');
                    return false;
                } else if (value.length < 10) {
                    showError(input, 'Описание задачи должно содержать минимум 10 символов');
                    return false;
                } else {
                    showSuccess(input);
                    return true;
                }
                
            default:
                showSuccess(input);
                return true;
        }
    };

    const validateForm = () => {
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    };

    // Показать сообщение об успехе
    const showSuccessMessage = (message) => {
        successMessage.textContent = message || 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.';
        successMessage.classList.add('show');
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 5000);
    };

    // Показать сообщение об ошибке
    const showErrorMessage = (message) => {
        successMessage.style.backgroundColor = '#e74c3c';
        successMessage.textContent = message || 'Произошла ошибка. Попробуйте позже.';
        successMessage.classList.add('show');
        setTimeout(() => {
            successMessage.classList.remove('show');
            successMessage.style.backgroundColor = '#2ecc71'; // Возвращаем зеленый цвет
        }, 5000);
    };

    // Отправка формы на сервер
    const submitFormToServer = async (formData) => {
        try {
            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                return { success: true, message: result.message };
            } else {
                // Обработка ошибок валидации от сервера
                if (result.errors && Array.isArray(result.errors)) {
                    result.errors.forEach(error => {
                        const field = document.getElementById(error.path);
                        if (field) {
                            showError(field, error.msg);
                        }
                    });
                }
                return { success: false, message: result.message || 'Ошибка отправки формы' };
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            return { success: false, message: 'Ошибка соединения с сервером. Проверьте интернет-подключение.' };
        }
    };

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (validateForm()) {
            const button = form.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            
            // Блокируем кнопку и показываем загрузку
            button.disabled = true;
            button.textContent = 'Отправляется...';
            
            // Собираем данные формы
            const formData = {
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                email: emailInput.value.trim(),
                company: document.getElementById('company').value.trim(),
                task: taskInput.value.trim(),
                promo: document.getElementById('promo').value.trim()
            };

            console.log('Отправляем данные:', formData);

            // Отправляем на сервер
            const result = await submitFormToServer(formData);

            if (result.success) {
                showSuccessMessage(result.message);
                form.reset(); // Очищаем форму после успешной отправки
                
                // Убираем все ошибки валидации
                inputs.forEach(input => showSuccess(input));
            } else {
                showErrorMessage(result.message);
            }

            // Разблокируем кнопку
            button.disabled = false;
            button.textContent = originalText;
        } else {
            console.log('Форма содержит ошибки.');
        }
    });
});