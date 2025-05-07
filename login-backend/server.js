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

// Middleware para verificar tokens JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' });
      }
      req.user = user;
      next();
    });
  } else {
    next(); // Por ahora, permitimos acceso sin token para debugging
  }
};

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

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const user = users[0];

    let assignedGroups = [];

    // Si es un docente, buscar los grupos asignados
if (user.user_type === 'docente') {
  const [rows] = await pool.query(`
    SELECT g.id AS groupId, g.name AS groupName, gr.name AS gradeName
    FROM \`groups\` g
    JOIN grades gr ON g.grade_id = gr.id
    WHERE g.teacher_id = (
      SELECT id FROM teachers WHERE name = ?
    )
  `, [user.name]);

  assignedGroups = rows.map(row => ({
    groupId: row.groupId,
    groupName: row.groupName,
    gradeName: row.gradeName
  }));
}

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
        role: user.user_type,
        assignedGroups // <-- Aquí enviamos los grupos asignados
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

// RUTAS PARA ALUMNOS

// Obtener alumnos por grupo
app.get('/api/admin/students/:groupId', verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log(`Obteniendo estudiantes para el grupo: ${groupId}`); // Para debugging
    const [rows] = await pool.query('SELECT * FROM students WHERE group_id = ?', [groupId]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

// Registrar un nuevo alumno
app.post('/api/admin/students', verifyToken, async (req, res) => {
  try {
    const { name, group_id } = req.body;
    if (!name || !group_id) {
      return res.status(400).json({ error: 'Nombre y grupo son requeridos' });
    }

    const [result] = await pool.query(
      'INSERT INTO students (name, group_id) VALUES (?, ?)',
      [name, group_id]
    );
    res.status(201).json({ message: 'Alumno registrado', id: result.insertId });
  } catch (error) {
    console.error('Error al registrar alumno:', error);
    res.status(500).json({ error: 'Error al registrar alumno' });
  }
});

// Actualizar un alumno
app.put('/api/admin/students/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, group_id, tasks_done, average_grade } = req.body;

    const [result] = await pool.query(
      'UPDATE students SET name = ?, group_id = ?, tasks_done = ?, average_grade = ? WHERE id = ?',
      [name, group_id, tasks_done, average_grade, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json({ message: 'Alumno actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar alumno:', error);
    res.status(500).json({ error: 'Error al actualizar alumno' });
  }
});

// Eliminar un alumno
app.delete('/api/admin/students/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json({ message: 'Alumno eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar alumno:', error);
    res.status(500).json({ error: 'Error al eliminar alumno' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});