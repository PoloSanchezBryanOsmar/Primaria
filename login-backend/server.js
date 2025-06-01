// server.js (el back-end)
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
        return res.status(403).json({ 
          error: 'Token inválido',
          details: err.message 
        });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({ error: 'Token requerido' });
  }
};

// FUNCIONES AUXILIARES
const generateUniqueUsername = async (connection, name) => {
  let baseUsername = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/\s+/g, '.') // Reemplazar espacios con puntos
    .replace(/[^a-z0-9.]/g, ''); // Remover caracteres especiales

  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUser.length === 0) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
};

const generateTemporaryPassword = (name) => {
  const currentYear = new Date().getFullYear();
  return `${name.replace(/\s+/g, '').toLowerCase()}${currentYear}`;
};

// RUTA DE LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, userType } = req.body;

    if (!['estudiante', 'docente', 'admin'].includes(userType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de usuario no válido' 
      });
    }

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

    // Si es docente, buscar grados asignados
    if (user.user_type === 'docente') {
      const [teacherResult] = await pool.query(
        'SELECT id FROM teachers WHERE name = ?',
        [user.name]
      );
      
      if (teacherResult.length > 0) {
        const teacherId = teacherResult[0].id;
        const [gradesResult] = await pool.query(`
          SELECT g.id AS gradeId, g.name AS gradeName, g.level AS groupName
          FROM grades g WHERE g.teacher_id = ?
        `, [teacherId]);
        
        assignedGroups = gradesResult.map(grade => ({
          gradeId: grade.gradeId,
          gradeName: grade.gradeName,
          groupName: grade.groupName
        }));
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.user_type,
        assignedGroups
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

// RUTA DE PRUEBA
app.get('/', (req, res) => {
  res.send('API de autenticación funcionando');
});

// RUTAS PARA ESTUDIANTES

// Obtener estudiantes por grado
app.get('/api/admin/students/:gradeId', verifyToken, async (req, res) => {
  try {
    const { gradeId } = req.params;
    const [rows] = await pool.query('SELECT * FROM students WHERE grade_id = ?', [gradeId]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

// Registrar nuevo estudiante
app.post('/api/admin/students', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { name, grade_id } = req.body;
    
    if (!name || !grade_id) {
      return res.status(400).json({ error: 'Nombre y grado son requeridos' });
    }

    await connection.beginTransaction();

    // Verificar si ya existe usuario con este nombre
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE name = ? AND user_type = ?',
      [name, 'estudiante']
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Ya existe un usuario con este nombre' 
      });
    }

    // Generar credenciales
    const username = await generateUniqueUsername(connection, name);
    const tempPassword = generateTemporaryPassword(name);

    // Crear usuario
    const [userResult] = await connection.query(
      'INSERT INTO users (username, password, name, user_type) VALUES (?, ?, ?, ?)',
      [username, tempPassword, name, 'estudiante']
    );

    // Crear estudiante
    const [studentResult] = await connection.query(
      'INSERT INTO students (name, grade_id, username) VALUES (?, ?, ?)',
      [name, grade_id, username]
    );

    await connection.commit();

    res.status(201).json({ 
      message: 'Estudiante y usuario creados correctamente',
      student: {
        id: studentResult.insertId,
        name: name,
        grade_id: grade_id,
        username: username
      },
      user: {
        username: username,
        password: tempPassword,
        user_type: 'estudiante'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar estudiante:', error);
    res.status(500).json({ 
      error: 'Error al registrar estudiante y usuario',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

// Actualizar estudiante
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

// Eliminar estudiante
app.delete('/api/admin/students/:id', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    
    await connection.beginTransaction();

    // Obtener datos del estudiante
    const [student] = await connection.query(
      'SELECT name, username FROM students WHERE id = ?', 
      [id]
    );

    if (student.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const studentData = student[0];

    // Eliminar usuario asociado
    if (studentData.username) {
      await connection.query(
        'DELETE FROM users WHERE username = ? AND user_type = ?',
        [studentData.username, 'estudiante']
      );
    } else {
      await connection.query(
        'DELETE FROM users WHERE name = ? AND user_type = ?',
        [studentData.name, 'estudiante']
      );
    }

    // Eliminar estudiante
    await connection.query('DELETE FROM students WHERE id = ?', [id]);
    await connection.commit();

    res.json({ message: 'Estudiante y usuario eliminados correctamente' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({ 
      error: 'Error al eliminar estudiante y usuario',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

// Obtener/Generar credenciales de estudiante
app.get('/api/admin/students/credentials/:studentId', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { studentId } = req.params;

    // Obtener información del estudiante
    const [student] = await connection.query(
      'SELECT id, name, username FROM students WHERE id = ?',
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const studentData = student[0];
    let userCredentials = null;
    
    // Buscar credenciales existentes
    if (studentData.username) {
      const [userByUsername] = await connection.query(
        'SELECT username, password, user_type FROM users WHERE username = ? AND user_type = ?',
        [studentData.username, 'estudiante']
      );
      
      if (userByUsername.length > 0) {
        userCredentials = userByUsername[0];
      }
    }
    
    if (!userCredentials) {
      const [userByName] = await connection.query(
        'SELECT username, password, user_type FROM users WHERE name = ? AND user_type = ?',
        [studentData.name, 'estudiante']
      );
      
      if (userByName.length > 0) {
        userCredentials = userByName[0];
        
        // Actualizar username en students si no lo tenía
        if (!studentData.username) {
          await connection.query(
            'UPDATE students SET username = ? WHERE id = ?',
            [userCredentials.username, studentId]
          );
        }
      }
    }

    // Si no existen credenciales, crearlas
    if (!userCredentials) {
      await connection.beginTransaction();
      
      try {
        const username = await generateUniqueUsername(connection, studentData.name);
        const tempPassword = generateTemporaryPassword(studentData.name);
        
        // Crear usuario
        await connection.query(
          'INSERT INTO users (username, password, name, user_type) VALUES (?, ?, ?, ?)',
          [username, tempPassword, studentData.name, 'estudiante']
        );
        
        // Actualizar estudiante
        await connection.query(
          'UPDATE students SET username = ? WHERE id = ?',
          [username, studentId]
        );
        
        await connection.commit();
        
        userCredentials = {
          username: username,
          password: tempPassword,
          user_type: 'estudiante'
        };
      } catch (createError) {
        await connection.rollback();
        throw createError;
      }
    }
    
    res.json({
      username: userCredentials.username,
      password: userCredentials.password,
      user_type: userCredentials.user_type,
      created_now: !student[0].username
    });
    
  } catch (error) {
    console.error('Error al obtener/crear credenciales:', error);
    res.status(500).json({ 
      error: 'Error al obtener credenciales del estudiante',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

// RUTAS PARA PUNTAJES
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

app.get('/api/admin/scores/top', verifyToken, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const gradeId = req.query.gradeId;
    
    let query = `
      SELECT name, score, correct_answers as correctAnswers, total_answered as totalAnswered, grade_id as gradeId,
      (SELECT CONCAT(g.name, ' - ', g.level) FROM grades g WHERE g.id = scores.grade_id) as gradeName
      FROM scores
    `;
    
    if (gradeId) {
      query += ' WHERE grade_id = ?';
      const [results] = await pool.query(query + ' ORDER BY score DESC, correct_answers DESC LIMIT ?', [gradeId, parseInt(limit)]);
      res.json(results);
    } else {
      const [results] = await pool.query(query + ' ORDER BY score DESC, correct_answers DESC LIMIT ?', [parseInt(limit)]);
      res.json(results);
    }
  } catch (error) {
    console.error('Error al obtener los mejores puntajes:', error);
    res.status(500).json({ error: 'Error al obtener los puntajes' });
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
      FROM scores WHERE grade_id = ?
    `, [gradeId]);
    
    if (results.length === 0) {
      return res.json({ totalAttempts: 0, avgScore: 0, highScore: 0 });
    }
    
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

// RUTAS PARA GRADOS
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

// RUTAS PARA QUIZZES
app.get('/api/quizzes', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quizzes');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener quizzes:', error);
    res.status(500).json({ error: 'Error al obtener quizzes' });
  }
});

app.get('/api/admin/quizzes/grade/:gradeId', verifyToken, async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    const [rows] = await pool.query(`
      SELECT q.*, IFNULL(qa.is_active, 0) as is_active
      FROM quizzes q
      LEFT JOIN quiz_activations qa ON q.quiz_id = qa.quiz_id AND qa.grade_id = ?
    `, [gradeId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener quizzes para el grado:', error);
    res.status(500).json({ error: 'Error al obtener quizzes para el grado' });
  }
});

app.post('/api/admin/quizzes/activate', verifyToken, async (req, res) => {
  try {
    const { quizId, gradeId, isActive } = req.body;
    const userId = req.user?.id || 1;
    
    console.log('Activando quiz:', { quizId, gradeId, isActive, userId });
    
    // Verificar si ya existe una activación para este quiz específico
    const [existing] = await pool.query(
      'SELECT * FROM quiz_activations WHERE quiz_id = ? AND grade_id = ?',
      [quizId, gradeId]
    );
    
    if (existing.length > 0) {
      // Actualizar activación existente
      await pool.query(
        'UPDATE quiz_activations SET is_active = ?, activated_by = ?, updated_at = NOW() WHERE quiz_id = ? AND grade_id = ?',
        [isActive ? 1 : 0, userId, quizId, gradeId]
      );
      console.log('Quiz actualizado en BD');
    } else {
      // Crear nueva activación
      await pool.query(
        'INSERT INTO quiz_activations (quiz_id, grade_id, is_active, activated_by) VALUES (?, ?, ?, ?)',
        [quizId, gradeId, isActive ? 1 : 0, userId]
      );
      console.log('Nueva activación creada en BD');
    }
    
    res.json({ 
      success: true, 
      message: `Quiz ${isActive ? 'activado' : 'desactivado'} correctamente`,
      quizId,
      gradeId,
      isActive
    });
  } catch (error) {
    console.error('Error al activar/desactivar quiz:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al activar/desactivar quiz',
      details: error.message 
    });
  }
});

app.get('/api/quizzes/active', verifyToken, async (req, res) => {
  try {
    const { gradeIds } = req.query;
    
    if (!gradeIds) {
      return res.status(400).json({ 
        error: 'Se requiere al menos un ID de grado' 
      });
    }
    
    const gradeIdsArray = gradeIds.split(',');
    
    const [rows] = await pool.query(`
      SELECT q.*, g.id as grade_id, g.name as grade_name, g.level as grade_level
      FROM quizzes q
      JOIN quiz_activations qa ON q.quiz_id = qa.quiz_id
      JOIN grades g ON qa.grade_id = g.id
      WHERE qa.is_active = 1 AND qa.grade_id IN (?)
    `, [gradeIdsArray]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener quizzes activos:', error);
    res.status(500).json({ error: 'Error al obtener quizzes activos' });
  }
});

// RUTAS PARA PERFIL
app.get('/api/admin/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ name: rows[0].name });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

app.put('/api/admin/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

app.put('/api/admin/profile/password', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (rows[0].password !== currentPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

// server.js - Rutas para activaciones del docente

// Obtener quizzes activos para un docente (que el admin activó para su grado)
app.get('/api/teacher/quizzes/available/:teacherId', verifyToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Obtener los grados asignados al docente
    const [teacherGrades] = await pool.query(`
      SELECT g.id as grade_id, g.name, g.level 
      FROM grades g 
      WHERE g.teacher_id = ?
    `, [teacherId]);
    
    if (teacherGrades.length === 0) {
      return res.json([]);
    }
    
    const gradeIds = teacherGrades.map(g => g.grade_id);
    
    // Obtener quizzes que el admin activó para estos grados
    const [quizzes] = await pool.query(`
      SELECT q.*, qa.is_active, g.id as grade_id, g.name as grade_name, g.level as grade_level,
             IFNULL(tqa.is_active_for_students, 0) as is_active_for_students
      FROM quizzes q
      JOIN quiz_activations qa ON q.quiz_id = qa.quiz_id
      JOIN grades g ON qa.grade_id = g.id
      LEFT JOIN teacher_quiz_activations tqa ON q.quiz_id = tqa.quiz_id 
                                             AND g.id = tqa.grade_id 
                                             AND tqa.teacher_id = ?
      WHERE qa.is_active = 1 AND qa.grade_id IN (?)
    `, [teacherId, gradeIds]);
    
    res.json(quizzes);
  } catch (error) {
    console.error('Error al obtener quizzes disponibles para el docente:', error);
    res.status(500).json({ error: 'Error al obtener quizzes disponibles' });
  }
});

// Activar/desactivar un quiz para estudiantes (por parte del docente)
app.post('/api/teacher/quizzes/activate-for-students', verifyToken, async (req, res) => {
  try {
    const { quizId, gradeId, teacherId, isActiveForStudents } = req.body;
    
    // Verificar que el docente esté asignado a este grado
    const [gradeCheck] = await pool.query(
      'SELECT * FROM grades WHERE id = ? AND teacher_id = ?',
      [gradeId, teacherId]
    );
    
    if (gradeCheck.length === 0) {
      return res.status(403).json({ 
        error: 'No tienes permisos para activar quizzes en este grado' 
      });
    }
    
    // Verificar si ya existe una activación
    const [existing] = await pool.query(
      'SELECT * FROM teacher_quiz_activations WHERE quiz_id = ? AND grade_id = ? AND teacher_id = ?',
      [quizId, gradeId, teacherId]
    );
    
    if (existing.length > 0) {
      // Actualizar el estado
      await pool.query(`
        UPDATE teacher_quiz_activations 
        SET is_active_for_students = ?, 
            ${isActiveForStudents ? 'activated_at = NOW(), deactivated_at = NULL' : 'deactivated_at = NOW()'},
            updated_at = NOW()
        WHERE quiz_id = ? AND grade_id = ? AND teacher_id = ?
      `, [isActiveForStudents ? 1 : 0, quizId, gradeId, teacherId]);
    } else {
      // Crear nueva activación
      await pool.query(
        'INSERT INTO teacher_quiz_activations (quiz_id, grade_id, teacher_id, is_active_for_students) VALUES (?, ?, ?, ?)',
        [quizId, gradeId, teacherId, isActiveForStudents ? 1 : 0]
      );
    }
    
    res.json({ 
      success: true, 
      message: `Quiz ${isActiveForStudents ? 'activado' : 'desactivado'} para estudiantes correctamente` 
    });
  } catch (error) {
    console.error('Error al activar/desactivar quiz para estudiantes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al activar/desactivar quiz para estudiantes' 
    });
  }
});

// Obtener quizzes activos para estudiantes de un grado específico
app.get('/api/student/quizzes/active/:gradeId', verifyToken, async (req, res) => {
  try {
    const { gradeId } = req.params;
    console.log(`Buscando quizzes activos para el grado: ${gradeId}`);
    
    // Obtener quizzes que el docente activó para los estudiantes de este grado
    const [quizzes] = await pool.query(`
      SELECT q.*, g.name as grade_name, g.level as grade_level, 
             tqa.activated_at, t.name as teacher_name
      FROM quizzes q
      JOIN teacher_quiz_activations tqa ON q.quiz_id = tqa.quiz_id
      JOIN grades g ON tqa.grade_id = g.id
      JOIN teachers t ON tqa.teacher_id = t.id
      WHERE tqa.is_active_for_students = 1 AND tqa.grade_id = ?
    `, [gradeId]);
    
    console.log(`Quizzes encontrados para el grado ${gradeId}:`, quizzes.length);
    console.log('Quizzes:', quizzes);
    
    res.json(quizzes);
  } catch (error) {
    console.error('Error al obtener quizzes activos para estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener quizzes activos para estudiantes' });
  }
});

// Obtener información del estudiante con su grado
app.get('/api/student/info/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    const [result] = await pool.query(`
      SELECT u.*, s.grade_id, g.name as grade_name, g.level as grade_level
      FROM users u
      LEFT JOIN students s ON u.name = s.name
      LEFT JOIN grades g ON s.grade_id = g.id
      WHERE u.username = ? AND u.user_type = 'estudiante'
    `, [username]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error al obtener información del estudiante:', error);
    res.status(500).json({ error: 'Error al obtener información del estudiante' });
  }
});

// Obtener ID del docente por nombre de usuario
app.get('/api/teacher/id/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    const [result] = await pool.query(`
      SELECT t.id as teacher_id, t.name, t.email
      FROM teachers t
      JOIN users u ON t.name = u.name
      WHERE u.username = ?
    `, [username]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error al obtener ID del docente:', error);
    res.status(500).json({ error: 'Error al obtener información del docente' });
  }
});

// Rutas adicionales para el servidor (agregar a server.js)

// Obtener estado de activación de un quiz específico
app.get('/api/admin/quizzes/status/:quizId/:gradeId', verifyToken, async (req, res) => {
  try {
    const { quizId, gradeId } = req.params;
    
    const [rows] = await pool.query(`
      SELECT is_active, activated_by, activated_at, updated_at
      FROM quiz_activations 
      WHERE quiz_id = ? AND grade_id = ?
    `, [quizId, gradeId]);
    
    if (rows.length === 0) {
      return res.json({ is_active: 0 });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener estado del quiz:', error);
    res.status(500).json({ error: 'Error al obtener estado del quiz' });
  }
});

// Obtener estadísticas de un quiz específico por grado
app.get('/api/admin/scores/stats/:gradeId/:quizId', verifyToken, async (req, res) => {
  try {
    const { gradeId, quizId } = req.params;
    
    const [results] = await pool.query(`
      SELECT 
        COUNT(*) as totalAttempts,
        COALESCE(AVG(score), 0) as avgScore,
        COALESCE(MAX(score), 0) as highScore
      FROM scores 
      WHERE grade_id = ? AND quiz_id = ?
    `, [gradeId, quizId]);
    
    if (results.length === 0) {
      return res.json({ totalAttempts: 0, avgScore: 0, highScore: 0 });
    }
    
    const stats = {
      totalAttempts: parseInt(results[0].totalAttempts),
      avgScore: Math.round(results[0].avgScore),
      highScore: parseInt(results[0].highScore)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas específicas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Obtener quizzes activos para un docente por materia
app.get('/api/teacher/quizzes/available/:teacherId/:subject', verifyToken, async (req, res) => {
  try {
    const { teacherId, subject } = req.params;
    
    // Obtener los grados asignados al docente
    const [teacherGrades] = await pool.query(`
      SELECT g.id as grade_id, g.name, g.level 
      FROM grades g 
      WHERE g.teacher_id = ?
    `, [teacherId]);
    
    if (teacherGrades.length === 0) {
      return res.json([]);
    }
    
    const gradeIds = teacherGrades.map(g => g.grade_id);
    
    // Obtener quizzes que el admin activó para estos grados y materia específica
    const [quizzes] = await pool.query(`
      SELECT q.*, qa.is_active, g.id as grade_id, g.name as grade_name, g.level as grade_level,
             IFNULL(tqa.is_active_for_students, 0) as is_active_for_students
      FROM quizzes q
      JOIN quiz_activations qa ON q.quiz_id = qa.quiz_id
      JOIN grades g ON qa.grade_id = g.id
      LEFT JOIN teacher_quiz_activations tqa ON q.quiz_id = tqa.quiz_id 
                                             AND g.id = tqa.grade_id 
                                             AND tqa.teacher_id = ?
      WHERE qa.is_active = 1 AND qa.grade_id IN (?) AND q.subject = ?
    `, [teacherId, gradeIds, subject]);
    
    res.json(quizzes);
  } catch (error) {
    console.error('Error al obtener quizzes por materia:', error);
    res.status(500).json({ error: 'Error al obtener quizzes por materia' });
  }
});

// Obtener quizzes activos para estudiantes por materia
app.get('/api/student/quizzes/active/:gradeId/:subject', verifyToken, async (req, res) => {
  try {
    const { gradeId, subject } = req.params;
    
    const [quizzes] = await pool.query(`
      SELECT q.*, g.name as grade_name, g.level as grade_level, 
             tqa.activated_at, t.name as teacher_name
      FROM quizzes q
      JOIN teacher_quiz_activations tqa ON q.quiz_id = tqa.quiz_id
      JOIN grades g ON tqa.grade_id = g.id
      JOIN teachers t ON tqa.teacher_id = t.id
      WHERE tqa.is_active_for_students = 1 AND tqa.grade_id = ? AND q.subject = ?
    `, [gradeId, subject]);
    
    res.json(quizzes);
  } catch (error) {
    console.error('Error al obtener quizzes activos por materia:', error);
    res.status(500).json({ error: 'Error al obtener quizzes activos por materia' });
  }
});

// Guardar puntaje con quiz_id
app.post('/api/admin/scores', verifyToken, async (req, res) => {
  try {
    const { name, score, correctAnswers, totalAnswered, gradeId, quizId } = req.body;
    
    if (!name || score === undefined) {
      return res.status(400).json({ error: 'Se requieren nombre y puntaje' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO scores (name, score, correct_answers, total_answered, grade_id, quiz_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, score, correctAnswers || 0, totalAnswered || 10, gradeId, quizId || 'esp_general']
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

// Obtener mejores puntajes por quiz específico
app.get('/api/admin/scores/top/:quizId', verifyToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const limit = req.query.limit || 10;
    const gradeId = req.query.gradeId;
    
    let query = `
      SELECT name, score, correct_answers as correctAnswers, total_answered as totalAnswered, 
             grade_id as gradeId, quiz_id as quizId,
             (SELECT CONCAT(g.name, ' - ', g.level) FROM grades g WHERE g.id = scores.grade_id) as gradeName
      FROM scores
      WHERE quiz_id = ?
    `;
    
    let params = [quizId];
    
    if (gradeId) {
      query += ' AND grade_id = ?';
      params.push(gradeId);
    }
    
    query += ' ORDER BY score DESC, correct_answers DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [results] = await pool.query(query, params);
    res.json(results);
  } catch (error) {
    console.error('Error al obtener los mejores puntajes por quiz:', error);
    res.status(500).json({ error: 'Error al obtener puntajes' });
  }
});

// Crear o actualizar un quiz en la base de datos
app.post('/api/admin/quizzes', verifyToken, async (req, res) => {
  try {
    const {
      quiz_id,
      title,
      description,
      subject,
      subject_id,
      difficulty,
      questions,
      time_limit,
      topics,
      icon,
      color
    } = req.body;

    // Verificar si el quiz ya existe
    const [existing] = await pool.query('SELECT * FROM quizzes WHERE quiz_id = ?', [quiz_id]);
    
    if (existing.length > 0) {
      // Actualizar quiz existente
      await pool.query(`
        UPDATE quizzes SET 
          title = ?, description = ?, subject = ?, subject_id = ?, 
          difficulty = ?, questions = ?, time_limit = ?, topics = ?, 
          icon = ?, color = ?, updated_at = NOW()
        WHERE quiz_id = ?
      `, [title, description, subject, subject_id, difficulty, questions, time_limit, 
          JSON.stringify(topics), icon, color, quiz_id]);
      
      res.json({ message: 'Quiz actualizado correctamente' });
    } else {
      // Crear nuevo quiz
      await pool.query(`
        INSERT INTO quizzes (quiz_id, title, description, subject, subject_id, difficulty, 
                           questions, time_limit, topics, icon, color) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [quiz_id, title, description, subject, subject_id, difficulty, questions, 
          time_limit, JSON.stringify(topics), icon, color]);
      
      res.status(201).json({ message: 'Quiz creado correctamente' });
    }
  } catch (error) {
    console.error('Error al guardar quiz:', error);
    res.status(500).json({ error: 'Error al guardar quiz' });
  }
});

// Obtener información detallada de un quiz
app.get('/api/admin/quizzes/:quizId', verifyToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const [rows] = await pool.query('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }
    
    const quiz = rows[0];
    
    // Parsear topics si está en formato JSON
    if (quiz.topics && typeof quiz.topics === 'string') {
      try {
        quiz.topics = JSON.parse(quiz.topics);
      } catch (e) {
        quiz.topics = [quiz.topics];
      }
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error al obtener quiz:', error);
    res.status(500).json({ error: 'Error al obtener quiz' });
  }
});

// Obtener todos los quizzes por materia
app.get('/api/admin/quizzes/subject/:subject', verifyToken, async (req, res) => {
  try {
    const { subject } = req.params;
    
    const [rows] = await pool.query('SELECT * FROM quizzes WHERE subject = ? ORDER BY created_at DESC', [subject]);
    
    // Procesar topics para cada quiz
    rows.forEach(quiz => {
      if (quiz.topics && typeof quiz.topics === 'string') {
        try {
          quiz.topics = JSON.parse(quiz.topics);
        } catch (e) {
          quiz.topics = [quiz.topics];
        }
      }
    });
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener quizzes por materia:', error);
    res.status(500).json({ error: 'Error al obtener quizzes' });
  }
});

// Eliminar un quiz
app.delete('/api/admin/quizzes/:quizId', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { quizId } = req.params;
    
    await connection.beginTransaction();
    
    // Eliminar activaciones relacionadas
    await connection.query('DELETE FROM teacher_quiz_activations WHERE quiz_id = ?', [quizId]);
    await connection.query('DELETE FROM quiz_activations WHERE quiz_id = ?', [quizId]);
    
    // Eliminar puntajes relacionados
    await connection.query('DELETE FROM scores WHERE quiz_id = ?', [quizId]);
    
    // Eliminar el quiz
    const [result] = await connection.query('DELETE FROM quizzes WHERE quiz_id = ?', [quizId]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }
    
    await connection.commit();
    res.json({ message: 'Quiz eliminado correctamente' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar quiz:', error);
    res.status(500).json({ error: 'Error al eliminar quiz' });
  } finally {
    connection.release();
  }
});

// Obtener reportes de uso de quizzes
app.get('/api/admin/reports/quiz-usage', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, gradeId, subject } = req.query;
    
    let query = `
      SELECT 
        q.quiz_id,
        q.title,
        q.subject,
        COUNT(s.id) as total_attempts,
        AVG(s.score) as avg_score,
        MAX(s.score) as max_score,
        MIN(s.score) as min_score,
        COUNT(DISTINCT s.name) as unique_students
      FROM quizzes q
      LEFT JOIN scores s ON q.quiz_id = s.quiz_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND s.created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND s.created_at <= ?';
      params.push(endDate);
    }
    
    if (gradeId) {
      query += ' AND s.grade_id = ?';
      params.push(gradeId);
    }
    
    if (subject) {
      query += ' AND q.subject = ?';
      params.push(subject);
    }
    
    query += ' GROUP BY q.quiz_id, q.title, q.subject ORDER BY total_attempts DESC';
    
    const [results] = await pool.query(query, params);
    
    // Procesar resultados
    const processedResults = results.map(row => ({
      ...row,
      avg_score: Math.round(row.avg_score || 0),
      total_attempts: parseInt(row.total_attempts || 0),
      unique_students: parseInt(row.unique_students || 0)
    }));
    
    res.json(processedResults);
  } catch (error) {
    console.error('Error al obtener reporte de uso:', error);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

// Exportar datos de quiz para análisis
app.get('/api/admin/export/quiz-data/:quizId', verifyToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { format = 'json' } = req.query;
    
    const [quizData] = await pool.query('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId]);
    const [scoresData] = await pool.query(`
      SELECT s.*, g.name as grade_name, g.level as grade_level 
      FROM scores s 
      LEFT JOIN grades g ON s.grade_id = g.id 
      WHERE s.quiz_id = ? 
      ORDER BY s.created_at DESC
    `, [quizId]);
    
    const exportData = {
      quiz: quizData[0],
      scores: scoresData,
      summary: {
        total_attempts: scoresData.length,
        avg_score: scoresData.length > 0 ? scoresData.reduce((sum, s) => sum + s.score, 0) / scoresData.length : 0,
        max_score: scoresData.length > 0 ? Math.max(...scoresData.map(s => s.score)) : 0,
        unique_students: new Set(scoresData.map(s => s.name)).size
      }
    };
    
    if (format === 'csv') {
      // Convertir a CSV simple
      let csv = 'Nombre,Puntaje,Respuestas Correctas,Total Respondidas,Grado,Fecha\n';
      scoresData.forEach(score => {
        csv += `"${score.name}",${score.score},${score.correct_answers},${score.total_answered},"${score.grade_name} - ${score.grade_level}","${score.created_at}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="quiz_${quizId}_data.csv"`);
      res.send(csv);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error al exportar datos:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});