const express = require('express');
const router = express.Router();
const path = require('path');

// Importar controladores usando rutas absolutas
const gradesController = require(path.join(__dirname, 'gradesController'));
const teachersController = require(path.join(__dirname, 'teachersController'));
const studentsController = require(path.join(__dirname, 'studentsController')); // Importación añadida

// Ruta de asignación de docentes - DEBE IR ANTES DE LAS RUTAS CON :id
router.post('/grades/assign', gradesController.assignTeacher);

// Rutas para grados
router.get('/grades', gradesController.getGrades);
router.post('/grades', gradesController.createGrade);
router.put('/grades/:id', gradesController.updateGrade);
router.delete('/grades/:id', gradesController.deleteGrade);
router.get('/grades/:id', gradesController.getGradeById);

// Rutas para docentes
router.get('/teachers', teachersController.getTeachers);
router.post('/teachers', teachersController.createTeacher);
router.put('/teachers/:id', teachersController.updateTeacher);
router.delete('/teachers/:id', teachersController.deleteTeacher);

// Rutas para estudiantes
router.get('/students/:gradeId', studentsController.getStudentsByGrade);
router.post('/students', studentsController.createStudent);
router.put('/students/:id', studentsController.updateStudent);
router.delete('/students/:id', studentsController.deleteStudent);

module.exports = router;