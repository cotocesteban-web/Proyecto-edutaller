-- MySQL dump 10.13  Distrib 8.4.9, for Win64 (x86_64)
--
-- Host: localhost    Database: educacontrol
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'Pedro  Cotoc','cotoc.esteban@gmail.com','41346892','Quiero mas informacion acerca del curso de electricidad.','2026-07-08 16:40:19'),(2,'Pedro Cotoc','cotoc.esteban@gmail.com','12133214','Quiero mas informacion acerca del curso de mecanica.','2026-07-08 19:31:28'),(3,'Fulano','fulano@gmail.com','1234665','info sobre el curo de mecanica','2026-07-09 17:24:57'),(4,'Rodrigo Sanchez','rodri@gmail.com','23453685','hola abritan nuevo cursos','2026-07-09 19:22:07');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(500) DEFAULT NULL,
  `instructor_id` int DEFAULT NULL,
  `schedules` varchar(255) DEFAULT NULL,
  `days` varchar(255) DEFAULT NULL,
  `cupo_maximo` int DEFAULT '10',
  `costo_inscripcion` decimal(10,2) DEFAULT '0.00',
  `costo_mensualidad` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `instructor_id` (`instructor_id`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (2,'Carpintería','Aprende el manejo de madera, cortes y ensambles.','/uploads/courses/1783491333842_images (1).jfif',26,NULL,NULL,10,0.00,0.00),(3,'Mecánica Automotriz','Introducción al mantenimiento y reparación de motores.','/uploads/courses/1783491348420_images (2).jfif',27,NULL,NULL,10,0.00,0.00),(4,'Soldadura Eléctrica','Técnicas de soldadura de arco y seguridad.','/uploads/courses/1783492284730_images (5).jfif',29,NULL,NULL,10,0.00,0.00),(5,'Chef ','Cocina Internacional con los mejores chefs de guatemala.\r\n\r\ninicia 23 de agosto al 9 de diciembre 2026\r\nhorarios: lunes  2:00 pm  a 6:00 pm\r\nformacion de 200 horas,\r\ncertificado avalado por mineduc.','/uploads/courses/1783491377121_images (4).jfif',28,NULL,NULL,10,0.00,0.00),(6,'Informatica','Aprenderas todo acerca de las tecnologias.','/uploads/courses/1783530360174_curso-de-informatica.jpeg',30,'9:00am  a 12:00  pm','lunes a viernes',19,150.00,200.00);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollment_requests`
--

DROP TABLE IF EXISTS `enrollment_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollment_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `course_id` int DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `enrollment_requests_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollment_requests`
--

LOCK TABLES `enrollment_requests` WRITE;
/*!40000 ALTER TABLE `enrollment_requests` DISABLE KEYS */;
INSERT INTO `enrollment_requests` VALUES (1,'mockuser@gmail.com','Usuario Prueba Google','12235678','zona 1 quetgo guatemala',4,'approved','2026-07-07 17:32:23'),(7,'cotoc.esteban@gmail.com','Esteban Cotoc','12437879','xela zona 1',2,'approved','2026-07-08 19:16:59'),(8,'cotoc.esteban@gmail.com','Esteban Cotoc','13255535431','aefgrggr',3,'approved','2026-07-08 19:17:25'),(9,'cotoc.esteban@gmail.com','Esteban Cotoc','136464562','aaaaaaaahtraa',4,'approved','2026-07-08 19:18:13'),(11,'cotoc.esteban@gmail.com','Esteban Cotoc','432676246','affvzcfr',6,'approved','2026-07-08 19:19:12'),(12,'cotoc.esteban@gmail.com','Esteban Cotoc','265436','aggr',5,'approved','2026-07-08 19:29:41');
/*!40000 ALTER TABLE `enrollment_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollments`
--

DROP TABLE IF EXISTS `enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `solvente` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`,`course_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollments`
--

LOCK TABLES `enrollments` WRITE;
/*!40000 ALTER TABLE `enrollments` DISABLE KEYS */;
INSERT INTO `enrollments` VALUES (3,17,6,'2026-07-08 19:22:02',1),(4,17,4,'2026-07-08 19:27:52',1),(5,17,3,'2026-07-08 19:27:57',1),(6,17,2,'2026-07-08 19:28:02',1),(7,17,5,'2026-07-08 19:32:41',1);
/*!40000 ALTER TABLE `enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `score` int DEFAULT NULL,
  `graded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `submission_text` text,
  `submission_file_url` varchar(500) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `task_id` (`task_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grades_chk_1` CHECK (((`score` >= 1) and (`score` <= 10)))
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES (4,3,17,8,'2026-07-09 16:59:49','Hola profesor. esta es mi tarea de Fundamentos de carpinteria.',NULL,'2026-07-09 16:28:33'),(6,4,17,7,'2026-07-09 17:57:08','hola profeor le hago entrega de mi trabajo de herramientas de carpinteria.','/uploads/submissions/1783618026480_ejercicio 3.3.12.pdf','2026-07-09 17:27:06'),(7,5,17,3,'2026-07-09 17:56:55','entrega #3','/uploads/submissions/1783619439861_Hoja de Ciencias. 06 al 10 de julio..pdf','2026-07-09 17:50:39'),(8,8,17,NULL,NULL,'hola profesor le envio mi primer tarea','/uploads/submissions/1783621129775_ejercicio 1.1.7.pdf','2026-07-09 18:18:49'),(9,7,17,NULL,NULL,'tarea de lista','/uploads/submissions/1783621168199_ejercicio 3.4.5.pdf','2026-07-09 18:19:28'),(10,1,17,NULL,NULL,NULL,'/uploads/submissions/1783621834455_ejercicio 1.3.6.pdf','2026-07-09 18:30:34'),(14,2,17,NULL,NULL,NULL,'/uploads/submissions/1783621880311_ejercicio 1.5.10.pdf','2026-07-09 18:31:20');
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `institution_settings`
--

DROP TABLE IF EXISTS `institution_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `institution_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=446 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `institution_settings`
--

LOCK TABLES `institution_settings` WRITE;
/*!40000 ALTER TABLE `institution_settings` DISABLE KEYS */;
INSERT INTO `institution_settings` VALUES (1,'hero_background_url','/uploads/presentation/1783627030727_WhatsApp Image 2026-05-20 at 9.58.20 AM.jpeg'),(2,'institution_name','Academia Técnica Edutaller'),(3,'presentation_text','Aprende habilidades técnicas con profesores expertos en talleres totalmente equipados. Tu camino hacia el éxito profesional comienza aquí.'),(4,'contact_email','contacto@edutaller.edu.gt'),(5,'contact_phone','+502 5555 1234'),(6,'contact_address','Calzada Roosevelt 12-34, Zona 11, Ciudad de Guatemala'),(180,'seeds_initialized','true'),(300,'mision_text','Brindar formación académica de la más alta calidad en áreas industriales y técnicas, potenciando las capacidades prácticas y teóricas de nuestros estudiantes para que respondan eficientemente a las demandas del sector productivo.'),(301,'vision_text','Ser la academia de capacitación técnica de referencia nacional, reconocida por la excelencia de nuestros instructores, la modernidad de nuestros métodos y el éxito profesional de nuestros egresados.'),(302,'mision_bg_url','/uploads/presentation/1783626146143_images (2).jfif'),(303,'vision_bg_url','/uploads/presentation/1783626146500_images (1).jfif'),(337,'hero_backgrounds_list','[\"/uploads/presentation/1783626409398_WhatsApp Image 2026-05-20 at 9.58.17 AM (2).jpeg\",\"/uploads/presentation/1783626841860_WhatsApp Image 2026-05-20 at 9.58.19 AM (2).jpeg\",\"/uploads/presentation/1783627003437_WhatsApp Image 2026-05-20 at 9.58.19 AM.jpeg\",\"/uploads/presentation/1783627016303_WhatsApp Image 2026-05-20 at 9.58.16 AM.jpeg\",\"/uploads/presentation/1783627028340_WhatsApp Image 2026-05-20 at 9.58.20 AM.jpeg\",\"/uploads/presentation/1783627030727_WhatsApp Image 2026-05-20 at 9.58.20 AM.jpeg\"]');
/*!40000 ALTER TABLE `institution_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `receipt_url` varchar(500) NOT NULL,
  `type` enum('inscription','monthly') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (4,17,149.99,'2026-07-09 16:29:44','/uploads/payments/1783614584224_Screenshot (695).png','inscription'),(5,17,150.00,'2026-07-09 16:31:15','/uploads/payments/1783614675985_Captura de pantalla (640).png','monthly'),(6,17,150.00,'2026-07-09 17:31:53','/uploads/payments/1783618313615_Screenshot (696).png','monthly'),(7,17,150.00,'2026-07-09 17:49:14','/uploads/payments/1783619353998_Screenshot (694).png','monthly'),(8,17,150.00,'2026-07-09 17:53:28','/uploads/payments/1783619608004_Captura de pantalla (635).png','inscription'),(9,17,150.00,'2026-07-09 18:20:50','/uploads/payments/1783621250480_Captura de pantalla (635).png','inscription'),(10,17,150.00,'2026-07-09 18:20:51','/uploads/payments/1783621251650_Captura de pantalla (635).png','inscription'),(11,17,150.00,'2026-07-09 18:23:28','/uploads/payments/1783621408866_Captura de pantalla (635).png','monthly');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,4,'tarea 1  investigacion de tipos de electrodo.','investigacion en formato pdf con caratura y bibliografia. \nvalor de la investigacion 10pts. \ndespues de la fecha de entrega no se recibiran trabajos.','2026-07-09 23:24:00'),(2,4,'tarea 2  investigacion de tipos de metales.','valor 10 puntos ','2026-07-10 00:43:00'),(3,2,'Tarea # 1.  Investigar  los fundamentos de Carpinteria.','formato pdf.  siguiendo las normas APA. ','2026-07-13 09:13:00'),(4,2,'tarea 2. Tipos de herramientas de Carpinteria','Entregar en formato Pdf ','2026-07-13 10:57:00'),(5,2,'tarea 3. Investigar medidas de seguridad del carpintero','Entregar en formato pdf. ete mismo dia se etara exponiendo en clae el dia lunes.','2026-07-13 10:58:00'),(6,2,'tarea #4 Pruebas de equipo en taller','formato pdf.','2026-07-13 22:00:00'),(7,3,'Tarea 1 Resumen del manual el mecanico.','El tema esta en la plataforma para que la descarguen y la resuman.','2026-07-13 12:08:00'),(8,3,'tarea 2 Reumen de Seguridad del Mecanico','Elaborar un resumen del material en la plataforma del libro de seguridad deun mecanico la entrega se realiza con formato pdf','2026-07-13 12:00:00');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','instructor','student') NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin1@gmail.com','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','admin','Administrador Uno',NULL,NULL,'2026-07-07 17:24:21'),(2,'admin2@gmail.com','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','admin','Administrador Dos',NULL,NULL,'2026-07-07 17:24:21'),(6,'estudiante1@gmail.com','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','student','Estudiante Uno',NULL,NULL,'2026-07-07 17:24:21'),(17,'cotoc.esteban@gmail.com','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','student','Esteban Cotoc','432676246','affvzcfr','2026-07-08 19:22:02'),(26,'profecarpintero@gmail.com','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','instructor','Juan Anibal Gomez  Perez','1243-6587',NULL,'2026-07-09 14:34:55'),(27,'profemecanico@gmail.com','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','instructor','Rodrigo Eduardo Gonzales','2134-4365',NULL,'2026-07-09 14:41:14'),(28,'profechef@gmail.com','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','instructor','Abel Ixco Juarez','2198-1243',NULL,'2026-07-09 14:42:20'),(29,'profesoldador@gmail.com','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','instructor','Antonio Braulio Zalazar ','2143-7643',NULL,'2026-07-09 14:44:24'),(30,'profeinformatico@gmail.com','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','instructor','Roberto Gomez Bolanos','2143-5687',NULL,'2026-07-09 14:45:56');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-10  0:16:43
