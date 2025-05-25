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

    // Si es un docente, buscar los grados asignados (versión actualizada)
    if (user.user_type === 'docente') {
      // Obtener ID del docente
      const [teacherResult] = await pool.query(
        'SELECT id FROM teachers WHERE name = ?',
        [user.name]
      );
      
      if (teacherResult.length > 0) {
        const teacherId = teacherResult[0].id;
        
        // Buscar grados asignados al docente
        const [gradesResult] = await pool.query(`
          SELECT g.id AS gradeId, g.name AS gradeName, g.level AS groupName
          FROM grades g
          WHERE g.teacher_id = ?
        `, [teacherId]);
        
        assignedGroups = gradesResult.map(grade => ({
          gradeId: grade.gradeId,
          gradeName: grade.gradeName,
          groupName: grade.groupName
        }));
      }
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
        assignedGroups // Mantener el mismo nombre para compatibilidad
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

// Obtener alumnos por grado
app.get('/api/admin/students/:gradeId', verifyToken, async (req, res) => {
  try {
    const { gradeId } = req.params;
    console.log(`Obteniendo estudiantes para el grado: ${gradeId}`); // Para debugging
    const [rows] = await pool.query('SELECT * FROM students WHERE grade_id = ?', [gradeId]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

// Registrar un nuevo alumno
app.post('/api/admin/students', verifyToken, async (req, res) => {
  try {
    const { name, grade_id } = req.body;
    if (!name || !grade_id) {
      return res.status(400).json({ error: 'Nombre y grado son requeridos' });
    }

    const [result] = await pool.query(
      'INSERT INTO students (name, grade_id) VALUES (?, ?)',
      [name, grade_id]
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
    const { name, grade_id, tasks_done, average_grade } = req.body;

    const [result] = await pool.query(
      'UPDATE students SET name = ?, grade_id = ?, tasks_done = ?, average_grade = ? WHERE id = ?',
      [name, grade_id, tasks_done, average_grade, id]
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
// Rutas adicionales para el backend (server.js)

// Ruta para guardar un nuevo puntaje
app.post('/api/admin/scores', verifyToken, async (req, res) => {
  try {
    const { name, score, correctAnswers, totalAnswered, gradeId } = req.body;
    
    if (!name || score === undefined) {
      return res.status(400).json({ error: 'Se requieren nombre y puntaje' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO scores (name, score, correct_answers, total_answered, grade_id) VALUES (?, ?, ?, ?, ?)',
      [name, score, correctAnswers || 0, totalAnswered || 10, gradeId]
    );
    
    res.status(201).json({ 
      message: 'Puntaje guardado correctamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al guardar puntaje:', error);
    res.status(500).json({ error: 'Error al guardar el puntaje' });
  }
});

// Obtener los mejores puntajes
app.get('/api/admin/scores/top', verifyToken, async (req, res) => {
  try {
    const limit = req.query.limit || 10; // Por defecto, devolver los 10 mejores
    const gradeId = req.query.gradeId; // Opcional, si queremos filtrar por grado
    
    let query = `
      SELECT name, score, correct_answers as correctAnswers, total_answered as totalAnswered, grade_id as gradeId,
      (SELECT CONCAT(g.name, ' - ', g.level) FROM grades g WHERE g.id = scores.grade_id) as gradeName
      FROM scores
    `;
    
    // Si se proporciona un gradeId, filtramos por ese grado
    if (gradeId) {
      query += ' WHERE grade_id = ?';
      const [results] = await pool.query(query + ' ORDER BY score DESC, correct_answers DESC LIMIT ?', [gradeId, parseInt(limit)]);
      res.json(results);
    } else {
      // Si no, devolvemos los mejores puntajes en general
      const [results] = await pool.query(query + ' ORDER BY score DESC, correct_answers DESC LIMIT ?', [parseInt(limit)]);
      res.json(results);
    }
  } catch (error) {
    console.error('Error al obtener los mejores puntajes:', error);
    res.status(500).json({ error: 'Error al obtener los puntajes' });
  }
});

// Obtener información de un grado específico
app.get('/api/admin/grades/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT g.*, t.name as teacher_name
      FROM grades g
      LEFT JOIN teachers t ON g.teacher_id = t.id
      WHERE g.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Grado no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener grado:', error);
    res.status(500).json({ error: 'Error al obtener información del grado' });
  }
});
app.get('/api/admin/scores/stats/:gradeId', verifyToken, async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    const [results] = await pool.query(`
      SELECT 
        COUNT(*) as totalAttempts,
        COALESCE(AVG(score), 0) as avgScore,
        COALESCE(MAX(score), 0) as highScore
      FROM scores 
      WHERE grade_id = ?
    `, [gradeId]);
    
    if (results.length === 0) {
      return res.json({ 
        totalAttempts: 0, 
        avgScore: 0, 
        highScore: 0 
      });
    }
    
    // Convertir a un formato redondeado
    const stats = {
      totalAttempts: parseInt(results[0].totalAttempts),
      avgScore: Math.round(results[0].avgScore),
      highScore: parseInt(results[0].highScore)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de puntajes:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});
// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});