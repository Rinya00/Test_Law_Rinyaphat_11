const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt'); // เพิ่ม bcrypt เพื่อแฮชและเปรียบเทียบรหัสผ่าน
const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "shopdee"
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เพิ่มสินค้า
app.post('/product', (req, res) => {
  const { productName, productDetail, price, cost, quantity } = req.body;

  if (!productName || !price || !cost || !quantity) {
    return res.status(400).send({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน', status: false });
  } //ตรวจสอบว่าไม่มีข้อมูลที่ขาดหายไป

  const sql = `INSERT INTO product (productName, productDetail, price, cost, quantity) VALUES (?, ?, ?, ?, ?)`; //ใช้เครื่องหมาย ? เพื่อป้องกัน SQL Injection
  db.query(sql, [productName, productDetail, price, cost, quantity], (err, result) => {
    if (err) {
      console.error('Error inserting product:', err);
      return res.status(500).send({ message: 'Error saving data', status: false });
    }
    res.send({ message: 'Product saved successfully', status: true });
  });
});

// ดึงข้อมูลสินค้าตาม ID
app.get('/product/:id', (req, res) => {
  const productID = req.params.id;

  if (isNaN(productID)) {
    return res.status(400).send({ message: 'Product ID must be a number', status: false });
  } //ตรวจสอบข้อมูลของ productID

  const sql = `SELECT * FROM product WHERE productID = ?`;
  db.query(sql, [productID], (err, result) => {
    if (err) {
      console.error('Error retrieving product:', err);
      return res.status(500).send({ message: 'Error retrieving product', status: false });
    } //ส่งข้อความข้อผิดพลาดที่เป็นกลางและบันทึกข้อผิดพลาดอย่างละเอียดในล๊อก
    res.send(result);
  });
});

// การเข้าสู่ระบบ
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: 'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน', status: false });
  }

  const sql = `SELECT * FROM customer WHERE username = ? AND isActive = 1`;
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).send({ message: 'Error during login', status: false });
    }

    if (results.length > 0) {
      const user = results[0];
      //ใช้ bcrypt.compare เพื่อเปรียบเทียบรหัสผ่านที่ได้รับกับรหัสผ่านที่แฮชในฐานข้อมูล
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).send({ message: 'Error comparing passwords', status: false });
        }
        if (isMatch) {
          user.message = 'Login successful';
          user.status = true;
          res.send(user);
        } else {
          res.status(401).send({ message: 'Invalid username or password', status: false });
        }
      });
    } else {
      res.status(401).send({ message: 'Invalid username or password', status: false });
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
