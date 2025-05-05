const express = require('express');
const router = express.Router();
const path = require('path');

// Importar controladores usando rutas absolutas
const gradesController = require(path.join(__dirname, 'gradesController'));
const groupsController = require(path.join(__dirname, 'groupsController'));
const teachersController = require(path.join(__dirname, 'teachersController'));
const assignmentsController = require(path.join(__dirname, 'assignmentsController'));

// Rutas para grados
router.get('/grades', gradesController.getGrades);
router.post('/grades', gradesController.createGrade);
router.put('/grades/:id', gradesController.updateGrade);
router.delete('/grades/:id', gradesController.deleteGrade);

// Rutas para grupos
router.get('/groups', groupsController.getGroups);
router.post('/groups', groupsController.createGroup);
router.put('/groups/:id', groupsController.updateGroup);
router.delete('/groups/:id', groupsController.deleteGroup);

// Rutas para docentes
router.get('/teachers', teachersController.getTeachers);
router.post('/teachers', teachersController.createTeacher);
router.put('/teachers/:id', teachersController.updateTeacher);
router.delete('/teachers/:id', teachersController.deleteTeacher);

// Rutas para asignaciones
router.post('/assign', assignmentsController.assignTeacherToGroup);

module.exports = router;