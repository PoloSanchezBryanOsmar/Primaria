const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const jwt = require('jsonwebtoken');
const adminRoutes = require('./admin/adminRoutes');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRoutes);

// Ruta de login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, userType } = req.body;
    
    // Validar tipo de usuario
    if (!['estudiante', 'docente', 'admin'].includes(userType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de usuario no válido' 
      });
    }
    
    // Buscar usuario en la base de datos
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND user_type = ? AND password = ?',
      [username, userType, password]
    );
    
    // Si no se encuentra el usuario o la contraseña no coincide
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }
    
    const user = users[0];
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.user_type 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Enviar respuesta exitosa
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.user_type
      },
      token
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de autenticación funcionando');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});