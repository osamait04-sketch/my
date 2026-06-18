const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// تفعيل مشاركة الموارد واستقبال الـ JSON
app.use(cors());
app.use(express.json());

// 🛠️ تشغيل ملفات متجرك من مجلد public تلقائياً عشان يفتح المتجر كامل لكل الزباين
app.use(express.static(path.join(__dirname, 'public')));

// 🔌 إعدادات التليغرام والـ Chat ID الفعلي الخاص بك
const TELEGRAM_TOKEN = "8919879986:AAG12r2b5wzSBqDClPmBZv39gapTmD-NJ0"; 
const TELEGRAM_CHAT_ID = "7154238531"; 

// 🌐 رابط قاعدة البيانات العالمي بعد دمج الباسورد (osamait04) فيه بنجاح
const MONGO_URI = "mongodb+srv://admin:osamait04@cluster0.hfrvapp.mongodb.net/?appName=Cluster0"; 

// الاتصال بقاعدة البيانات العالمية MongoDB Atlas
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ تم الاتصال بنجاح بقاعدة البيانات العالمية MongoDB Atlas'))
    .catch(err => console.error('❌ فشل الاتصال بقاعدة البيانات:', err));

// هيكل المنتجات في قاعدة البيانات
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: 'https://via.placeholder.com/280' }
});
const Product = mongoose.model('Product', productSchema);

// جلب كل المنتجات (للعمل بشكل عالمي)
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب البيانات" });
    }
});

// إضافة منتج جديد (من صفحة الأدمن)
app.post('/api/products', async (req, res) => {
    try {
        const { name, price, image } = req.body;
        const newProduct = new Product({ name, price, image });
        await newProduct.save();
        res.status(201).json({ success: true, product: newProduct });
    } catch (error) {
        res.status(500).json({ message: "خطأ في حفظ المنتج" });
    }
});

// حذف منتج (من صفحة الأدمن)
app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "تم حذف القطعة بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "خطأ في حذف المنتج" });
    }
});

// 🛍️ استقبال طلبات الشراء وإرسالها فوراً للتليغرام
app.post('/api/orders', async (req, res) => {
    const { name, phone, address, cart, total } = req.body;

    let message = `✨ *طلب شراء جديد من Aura Store* ✨\n\n`;
    message += `👤 *الزبون:* ${name}\n`;
    message += `📞 *الهاتف:* ${phone}\n`;
    message += `📍 *العنوان:* ${address}\n\n`;
    message += `📦 *المقتنيات:* \n`;
    
    if (cart && Array.isArray(cart)) {
        cart.forEach(item => {
            message += `• ${item.name} (${item.quantity} قطع) - $${item.price}\n`;
        });
    }

    message += `\n💰 *الإجمالي الكلي:* $${total}`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        res.json({ success: true, message: "تم إرسال الطلب إلى التليغرام بنجاح!" });
    } catch (error) {
        console.error("❌ خطأ في إرسال التليغرام:", error.message);
        res.status(500).json({ success: false, message: "فشل إرسال الإشعار للتليغرام" });
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل الآن بنجاح على المنفذ ${PORT}`);
});