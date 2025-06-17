const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для безопасности
app.use(helmet());

// CORS настройки
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Парсинг JSON и URL-encoded данных
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Раздача статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting - ограничение количества запросов
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // максимум 5 запросов с одного IP
    message: {
        error: 'Слишком много запросов. Попробуйте позже.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Применяем rate limiting только к форме
app.use('/api/submit-form', limiter);

// Настройка email транспорта (Nodemailer)
const createEmailTransporter = () => {
    // Для Gmail
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS // App Password для Gmail
            }
        });
    }
    
    // Для других SMTP серверов
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Валидация полей формы
const validateForm = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Имя должно содержать от 2 до 50 символов')
        .matches(/^[а-яёa-z\s-]+$/i)
        .withMessage('Имя может содержать только буквы, пробелы и дефисы'),
    
    body('phone')
        .trim()
        .matches(/^\+?[1-9][0-9]{7,14}$/)
        .withMessage('Некорректный формат телефона'),
    
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Некорректный email адрес'),
    
    body('company')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Название компании не должно превышать 100 символов'),
    
    body('task')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Описание задачи должно содержать от 10 до 1000 символов'),
    
    body('promo')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Промокод не должен превышать 50 символов')
];

// Функция отправки email
const sendEmail = async (formData) => {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        subject: 'Новая заявка на расчет стоимости',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #F15F31; border-bottom: 2px solid #F15F31; padding-bottom: 10px;">
                    Новая заявка на расчет стоимости
                </h2>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Информация о клиенте:</h3>
                    
                    <p><strong>Имя:</strong> ${formData.name}</p>
                    <p><strong>Телефон:</strong> ${formData.phone}</p>
                    <p><strong>Email:</strong> ${formData.email}</p>
                    ${formData.company ? `<p><strong>Компания:</strong> ${formData.company}</p>` : ''}
                    ${formData.promo ? `<p><strong>Промокод:</strong> ${formData.promo}</p>` : ''}
                </div>
                
                <div style="background-color: #fff; padding: 20px; border-left: 4px solid #F15F31; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Описание задачи:</h3>
                    <p style="line-height: 1.6; color: #555;">${formData.task}</p>
                </div>
                
                <div style="margin-top: 30px; padding: 15px; background-color: #e8f5e8; border-radius: 5px;">
                    <p style="margin: 0; color: #2e7d2e; font-size: 14px;">
                        <strong>Дата подачи заявки:</strong> ${new Date().toLocaleString('ru-RU')}
                    </p>
                </div>
            </div>
        `
    };
    
    // Отправка email клиенту (подтверждение)
    const clientMailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: formData.email,
        subject: 'Ваша заявка принята - Расчет стоимости',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #F15F31; border-bottom: 2px solid #F15F31; padding-bottom: 10px;">
                    Спасибо за вашу заявку!
                </h2>
                
                <p>Здравствуйте, <strong>${formData.name}</strong>!</p>
                
                <p>Мы получили вашу заявку на расчет стоимости и свяжемся с вами в ближайшее время.</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Ваши данные:</h3>
                    <p><strong>Телефон:</strong> ${formData.phone}</p>
                    <p><strong>Email:</strong> ${formData.email}</p>
                    ${formData.company ? `<p><strong>Компания:</strong> ${formData.company}</p>` : ''}
                </div>
                
                <div style="background-color: #fff; padding: 20px; border-left: 4px solid #F15F31; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Ваша задача:</h3>
                    <p style="line-height: 1.6; color: #555;">${formData.task}</p>
                </div>
                
                <p>Если у вас есть дополнительные вопросы, не стесняйтесь обращаться к нам.</p>
                
                <div style="margin-top: 30px; padding: 15px; background-color: #e8f5e8; border-radius: 5px;">
                    <p style="margin: 0; color: #2e7d2e; font-size: 14px;">
                        С уважением,<br>
                        Команда печатного агентства
                    </p>
                </div>
            </div>
        `
    };
    
    try {
        // Отправляем email администратору
        await transporter.sendMail(mailOptions);
        
        // Отправляем подтверждение клиенту
        await transporter.sendMail(clientMailOptions);
        
        return { success: true };
    } catch (error) {
        console.error('Ошибка отправки email:', error);
        return { success: false, error: error.message };
    }
};

// Сохранение заявки в "базу данных" (файл)
const saveToDatabase = async (formData) => {
    const fs = require('fs').promises;
    const dataFile = path.join(__dirname, 'data', 'submissions.json');
    
    try {
        // Создаем папку data если её нет
        await fs.mkdir(path.dirname(dataFile), { recursive: true });
        
        let submissions = [];
        
        // Читаем существующие данные
        try {
            const data = await fs.readFile(dataFile, 'utf8');
            submissions = JSON.parse(data);
        } catch (error) {
            // Файл не существует, создаем новый массив
            submissions = [];
        }
        
        // Добавляем новую заявку
        const newSubmission = {
            id: Date.now(),
            ...formData,
            timestamp: new Date().toISOString(),
            ip: formData.ip
        };
        
        submissions.push(newSubmission);
        
        // Сохраняем обновленные данные
        await fs.writeFile(dataFile, JSON.stringify(submissions, null, 2));
        
        return { success: true, id: newSubmission.id };
    } catch (error) {
        console.error('Ошибка сохранения в базу данных:', error);
        return { success: false, error: error.message };
    }
};

// API endpoint для обработки формы
app.post('/api/submit-form', validateForm, async (req, res) => {
    try {
        // Проверка валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Ошибки валидации',
                errors: errors.array()
            });
        }
        
        // Получаем данные формы
        const formData = {
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            company: req.body.company || '',
            task: req.body.task,
            promo: req.body.promo || '',
            ip: req.ip || req.connection.remoteAddress
        };
        
        // Сохраняем в "базу данных"
        const saveResult = await saveToDatabase(formData);
        if (!saveResult.success) {
            console.error('Ошибка сохранения:', saveResult.error);
        }
        
        // Отправляем email (если настроен)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const emailResult = await sendEmail(formData);
            if (!emailResult.success) {
                console.error('Ошибка отправки email:', emailResult.error);
                // Не возвращаем ошибку клиенту, чтобы не показывать проблемы с почтой
            }
        }
        
        // Успешный ответ
        res.json({
            success: true,
            message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
            id: saveResult.id
        });
        
    } catch (error) {
        console.error('Ошибка обработки формы:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера. Попробуйте позже.'
        });
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API для получения статистики (опционально)
app.get('/api/stats', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const dataFile = path.join(__dirname, 'data', 'submissions.json');
        
        const data = await fs.readFile(dataFile, 'utf8');
        const submissions = JSON.parse(data);
        
        const stats = {
            total: submissions.length,
            today: submissions.filter(s => {
                const today = new Date().toDateString();
                const submissionDate = new Date(s.timestamp).toDateString();
                return today === submissionDate;
            }).length,
            thisWeek: submissions.filter(s => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(s.timestamp) > weekAgo;
            }).length
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});

// Обработка 404 ошибок
app.use((req, res) => {
    res.status(404).json({ error: 'Страница не найдена' });
});

// Обработка глобальных ошибок
app.use((error, req, res, next) => {
    console.error('Глобальная ошибка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📂 Статические файлы: http://localhost:${PORT}`);
    console.log(`📧 Email настроен: ${process.env.EMAIL_USER ? '✅ Да' : '❌ Нет'}`);
});

module.exports = app;