const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// DB Connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verification Tokens
const verificationTokens = new Map();

// Found Item Registration
app.post('/api/found', (req, res) => {
  const { email, item_name, color, brand, location } = req.body;

  if (!email || !item_name || !color || !location) {
    return res.status(400).json({ message: '❗ Missing required fields (email, item_name, color, location)' });
  }

  const sql = 'INSERT INTO found_items (email, item_name, color, brand, location, verified) VALUES (?, ?, ?, ?, ?, 0)';
  db.query(sql, [email, item_name, color, brand, location], (err, result) => {
    if (err) {
      console.error("❌ Database insert error:", err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    const token = Math.random().toString(36).substring(2);
    verificationTokens.set(token, { id: result.insertId, type: 'found' });

    // ✅ FIXED: Use your actual backend URL from Render
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const verifyLink = `${baseUrl}/api/verify/${token}`;

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your found item',
html: `
  <p>✅ Your item has been successfully registered.</p>
  <p>Please click the link below to verify your found item:</p>
  <p><a href="${verifyLink}" style="color: blue; text-decoration: underline;">${verifyLink}</a></p>
  <p>If the link doesn't open automatically, copy and paste it into your browser.</p>
  <hr>
  <p>Lost & Found System</p>
`



    }, (emailErr, info) => {
      if (emailErr) {
        console.error("📧 Email send error:", emailErr);
        return res.status(500).json({ message: 'Failed to send verification email', error: emailErr.message });
      }

      console.log(`📧 Verification email sent to ${email}`);
      res.json({ message: 'Found item registered. Please verify your email.' });
    });
  });
});

// Email Verification
app.get('/api/verify/:token', (req, res) => {
  const token = req.params.token;
  const data = verificationTokens.get(token);

  if (!data) return res.status(400).send('❌ Invalid or expired token');
  verificationTokens.delete(token);

  const table = data.type === 'found' ? 'found_items' : 'lost_items';
  db.query(`UPDATE ${table} SET verified = 1 WHERE id = ?`, [data.id], (err) => {
    if (err) {
      console.error("❌ DB update error during verification:", err);
      return res.status(500).send('Database error during verification');
    }
    res.send('✅ Email verified successfully. You can now search or list items.');
  });
});

// Search Lost Item
app.post('/api/search', (req, res) => {
  let { item_name, color, brand } = req.body;

  if (!item_name) return res.status(400).json({ message: 'Item name required' });

  item_name = item_name.toLowerCase().trim();
  color = color?.toLowerCase().trim();
  brand = brand?.toLowerCase().trim();

  db.query('SELECT * FROM found_items WHERE verified = 1', (err, results) => {
    if (err) {
      console.error("❌ DB error during search:", err);
      return res.status(500).json({ message: 'DB error during search', error: err.message });
    }

    const filtered = results.filter(item => {
      const dbName = (item.item_name || '').toLowerCase();
      const dbColor = (item.color || '').toLowerCase();
      const dbBrand = (item.brand || '').toLowerCase();

      const nameMatch = dbName.includes(item_name);
      const colorMatch = !color || dbColor.includes(color);
      const brandMatch = !brand || dbBrand.includes(brand);

      return nameMatch && colorMatch && brandMatch;
    });

    return res.json(filtered);
  });
});

// Start Server (✅ Dynamic PORT for Render)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

