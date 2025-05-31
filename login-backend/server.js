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
  
  console.log('Headers de autorización:', authHeader); // Debug
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    console.log('Token extraído:', token ? 'Token presente' : 'Token vacío'); // Debug
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('Error de verificación de token:', err.message); // Debug
        return res.status(403).json({ 
          error: 'Token inválido',
          details: err.message 
        });
      }
      
      console.log('Usuario verificado:', user); // Debug
      req.user = user;
      next();
    });
  } else {
    console.log('No se encontró header de autorización'); // Debug
    return res.status(401).json({ error: 'Token requerido' });
  }
};

// FUNCIÓN AUXILIAR: Generar username único
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
    
    if (existingUser.length === 0) {
      break; // Username disponible
    }
    
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
};

// FUNCIÓN AUXILIAR: Generar contraseña temporal
const generateTemporaryPassword = (name) => {
  const currentYear = new Date().getFullYear();
  return `${name.replace(/\s+/g, '').toLowerCase()}${currentYear}`;
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

    // Si es un docente, buscar los grados asignados
    if (user.user_type === 'docente') {
      const [teacherResult] = await pool.query(
        'SELECT id FROM teachers WHERE name = ?',
        [user.name]
      );
      
      if (teacherResult.length > 0) {
        const teacherId = teacherResult[0].id;
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

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de autenticación funcionando');
});

// RUTAS PARA ALUMNOS

// Obtener alumnos por grado
app.get('/api/admin/students/:gradeId', verifyToken, async (req, res) => {
  try {
    const { gradeId } = req.params;
    console.log(`Obteniendo estudiantes para el grado: ${gradeId}`);
    const [rows] = await pool.query('SELECT * FROM students WHERE grade_id = ?', [gradeId]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

// Registrar un nuevo alumno (corregido)
app.post('/api/admin/students', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { name, grade_id } = req.body;
    
    if (!name || !grade_id) {
      return res.status(400).json({ error: 'Nombre y grado son requeridos' });
    }

    console.log('Iniciando creación de estudiante:', { name, grade_id });

    // Iniciar transacción
    await connection.beginTransaction();

    // 1. Verificar si ya existe un usuario con este nombre
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

    // 2. Generar username único
    const username = await generateUniqueUsername(connection, name);
    console.log('Username generado:', username);

    // 3. Generar contraseña temporal
    const tempPassword = generateTemporaryPassword(name);
    console.log('Password generado:', tempPassword);

    // 4. Crear el usuario en la tabla users
    const [userResult] = await connection.query(
      'INSERT INTO users (username, password, name, user_type) VALUES (?, ?, ?, ?)',
      [username, tempPassword, name, 'estudiante']
    );

    console.log('Usuario creado con ID:', userResult.insertId);

    // 5. Crear el estudiante en la tabla students
    const [studentResult] = await connection.query(
      'INSERT INTO students (name, grade_id, username) VALUES (?, ?, ?)',
      [name, grade_id, username]
    );

    const studentId = studentResult.insertId;
    console.log('Estudiante creado con ID:', studentId);

    // Confirmar transacción
    await connection.commit();
    console.log('Transacción completada exitosamente');

    res.status(201).json({ 
      message: 'Estudiante y usuario creados correctamente',
      student: {
        id: studentId,
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
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error('Error detallado al registrar estudiante:', error);
    res.status(500).json({ 
      error: 'Error al registrar estudiante y usuario',
      details: error.message 
    });
  } finally {
    connection.release();
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

// Eliminar un alumno (actualizado)
app.delete('/api/admin/students/:id', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    
    console.log('Eliminando estudiante ID:', id);
    
    // Iniciar transacción
    await connection.beginTransaction();

    // 1. Obtener información del estudiante antes de eliminarlo
    const [student] = await connection.query(
      'SELECT name, username FROM students WHERE id = ?', 
      [id]
    );

    if (student.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const studentData = student[0];
    console.log('Datos del estudiante a eliminar:', studentData);

    // 2. Eliminar el usuario asociado
    if (studentData.username) {
      // Eliminar por username
      await connection.query(
        'DELETE FROM users WHERE username = ? AND user_type = ?',
        [studentData.username, 'estudiante']
      );
      console.log('Usuario eliminado por username:', studentData.username);
    } else {
      // Fallback: eliminar por nombre
      await connection.query(
        'DELETE FROM users WHERE name = ? AND user_type = ?',
        [studentData.name, 'estudiante']
      );
      console.log('Usuario eliminado por nombre:', studentData.name);
    }

    // 3. Eliminar el estudiante
    const [result] = await connection.query(
      'DELETE FROM students WHERE id = ?', 
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    console.log('Estudiante eliminado correctamente');

    // Confirmar transacción
    await connection.commit();

    res.json({ 
      message: 'Estudiante y usuario eliminados correctamente' 
    });

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

// Obtener credenciales (generar si no existen)
app.get('/api/admin/students/credentials/:studentId', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { studentId } = req.params;
    
    console.log('Buscando credenciales para estudiante ID:', studentId);
    console.log('Usuario autenticado:', req.user); // Debug: verificar usuario

    // 1. Obtener información del estudiante
    const [student] = await connection.query(
      'SELECT id, name, username FROM students WHERE id = ?',
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const studentData = student[0];
    console.log('Datos del estudiante:', studentData);

    // 2. Buscar si ya existe un usuario para este estudiante
    let userCredentials = null;
    
    // Primero buscar por username si existe
    if (studentData.username) {
      const [userByUsername] = await connection.query(
        'SELECT username, password, user_type FROM users WHERE username = ? AND user_type = ?',
        [studentData.username, 'estudiante']
      );
      
      if (userByUsername.length > 0) {
        userCredentials = userByUsername[0];
        console.log('Credenciales encontradas por username:', userCredentials);
      }
    }
    
    // Si no se encontró por username, buscar por nombre
    if (!userCredentials) {
      const [userByName] = await connection.query(
        'SELECT username, password, user_type FROM users WHERE name = ? AND user_type = ?',
        [studentData.name, 'estudiante']
      );
      
      if (userByName.length > 0) {
        userCredentials = userByName[0];
        console.log('Credenciales encontradas por nombre:', userCredentials);
        
        // Actualizar el username en la tabla students si no lo tenía
        if (!studentData.username) {
          await connection.query(
            'UPDATE students SET username = ? WHERE id = ?',
            [userCredentials.username, studentId]
          );
          console.log('Username actualizado en tabla students');
        }
      }
    }

    // 3. Si no existe usuario, crearlo
    if (!userCredentials) {
      console.log('No se encontraron credenciales, creando nuevas...');
      
      await connection.beginTransaction();
      
      try {
        // Generar username único
        const username = await generateUniqueUsername(connection, studentData.name);
        console.log('Nuevo username generado:', username);
        
        // Generar contraseña temporal
        const tempPassword = generateTemporaryPassword(studentData.name);
        console.log('Nueva password generada:', tempPassword);
        
        // Crear el usuario
        const [insertResult] = await connection.query(
          'INSERT INTO users (username, password, name, user_type) VALUES (?, ?, ?, ?)',
          [username, tempPassword, studentData.name, 'estudiante']
        );
        
        console.log('Nuevo usuario creado con ID:', insertResult.insertId);
        
        // Actualizar el estudiante con el username
        await connection.query(
          'UPDATE students SET username = ? WHERE id = ?',
          [username, studentId]
        );
        
        console.log('Estudiante actualizado con username');
        
        await connection.commit();
        
        userCredentials = {
          username: username,
          password: tempPassword,
          user_type: 'estudiante'
        };
        
        console.log('Credenciales creadas exitosamente:', userCredentials);
      } catch (createError) {
        await connection.rollback();
        console.error('Error al crear credenciales:', createError);
        throw createError;
      }
    }
    
    res.json({
      username: userCredentials.username,
      password: userCredentials.password,
      user_type: userCredentials.user_type,
      created_now: !student[0].username // Indica si se acabaron de crear
    });
    
  } catch (error) {
    console.error('Error completo al obtener/crear credenciales:', error);
    res.status(500).json({ 
      error: 'Error al obtener credenciales del estudiante',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

// Obtener credenciales por nombre (backup)
app.get('/api/admin/students/credentials/name/:name', verifyToken, async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);
    
    const [user] = await pool.query(
      'SELECT username, password, user_type FROM users WHERE name = ? AND user_type = ?',
      [decodedName, 'estudiante']
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'Credenciales de estudiante no encontradas' });
    }
    
    res.json({
      username: user[0].username,
      password: user[0].password,
      user_type: user[0].user_type
    });
    
  } catch (error) {
    console.error('Error al obtener credenciales:', error);
    res.status(500).json({ error: 'Error al obtener credenciales del estudiante' });
  }
});

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

// Rutas para quizzes
app.get('/api/quizzes', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quizzes');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener quizzes:', error);
    res.status(500).json({ error: 'Error al obtener quizzes' });
  }
});

// Obtener quizzes para un grado específico con su estado de activación
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

// Activar/desactivar un quiz para un grado específico
app.post('/api/admin/quizzes/activate', verifyToken, async (req, res) => {
  try {
    const { quizId, gradeId, isActive } = req.body;
    const userId = req.user?.id || 1;
    
    const [existing] = await pool.query(
      'SELECT * FROM quiz_activations WHERE quiz_id = ? AND grade_id = ?',
      [quizId, gradeId]
    );
    
    if (existing.length > 0) {
      await pool.query(
        'UPDATE quiz_activations SET is_active = ?, activated_by = ?, updated_at = NOW() WHERE quiz_id = ? AND grade_id = ?',
        [isActive ? 1 : 0, userId, quizId, gradeId]
      );
    } else {
      await pool.query(
        'INSERT INTO quiz_activations (quiz_id, grade_id, is_active, activated_by) VALUES (?, ?, ?, ?)',
        [quizId, gradeId, isActive ? 1 : 0, userId]
      );
    }
    
    res.json({ 
      success: true, 
      message: `Quiz ${isActive ? 'activado' : 'desactivado'} correctamente` 
    });
  } catch (error) {
    console.error('Error al activar/desactivar quiz:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al activar/desactivar quiz' 
    });
  }
});

// Obtener quizzes activos para un docente
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});