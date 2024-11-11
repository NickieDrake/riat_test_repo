const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');

//const app = express();
const app = express();
const port = 3000;

// Настройка подключения к базе данных MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'nuck',
  database: 'riat'
});

db.connect((err) => {
  if (err) {
    //console.log('Error');
    throw err
  }
  console.log('INFO: Подключено к базе данных MySQL\n');

  // Создание таблицы пользователей, если она не существует
  db.query('CREATE TABLE IF NOT EXISTS Users (id INT AUTO_INCREMENT PRIMARY KEY, login VARCHAR(60), password VARCHAR(60), firstName VARCHAR(255), lastName VARCHAR(255), phone VARCHAR(50))', 
    (err, result) => {
    if (err) throw err;
    console.log('INFO: Таблица пользователей создана или уже существует\n');
  });

  db.query('CREATE TABLE IF NOT EXISTS Partisipants (id_part INT AUTO_INCREMENT PRIMARY KEY, owner_id INT, name VARCHAR(50))', 
    (err, result) => {
    if (err) throw err;
    console.log('INFO: Таблица участников создана или уже существует\n');
  });
  
  // Middleware для парсинга JSON
  app.use(bodyParser.json());
  
  // Маршрут для добавления пользователя
  app.post('/users', (req, res) => {
    const { login, password, firstName, lastName, phone } = req.body;
    const query = 'INSERT INTO Users (login, password, firstName, lastName, phone) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [login, password, firstName, lastName, phone], (err, result) => {
      if (err) {
        console.log('ERROR: Ошибка при добавлении пользователя\n');
        return res.status(500).send('ERROR: Ошибка при добавлении пользователя');
        
      }
      console.log('INFO: Пользователь добавлен');
      res.status(201).send('Пользователь добавлен');
    });
  });

  app.post('/users_auth', (req, res) => {
    const { login, password } = req.body;
    const query = 'SELECT * FROM Users WHERE login = ? AND password = ?';
    db.query(query, [login, password], (err, result) => {
      if (err) {
        console.log('ERROR: Ошибка при авторизации пользователя\n');
        return res.status(500).send('ERROR: Ошибка при авторизации пользователя');
        
      }
      if (result.length > 0) {
        console.log('INFO: Авторизация пользователя успешна\n');
        res.status(201).send('Авторизация пользователя успешна');
      } else {
        console.log('INFO: Пользователь не найден\n');
        res.status(201).send('Пользователь не найден');
      }
      
    });
  });

  app.post('/parts', (req, res) => {
    const { owner_id, name } = req.body;

    //поиск, существует ли пользователь
    const query_check = 'SELECT * FROM Users WHERE id = ?';
    db.query(query_check, [owner_id], (err, result) => {

      if (err) {
        console.log('ERROR: Ошибка при поиске пользователя\n');
        return res.status(500).send('ERROR: Ошибка при поиске пользователя');
        
      }
      if (result.length > 0) {
        // console.log('INFO: Авторизация пользователя успешна');
        // res.status(201).send('Авторизация пользователя успешна');

        //если пользователь существует - создание участника
        const query = 'INSERT INTO Partisipants (owner_id, name) VALUES (?, ?)';
        db.query(query, [owner_id, name], (err, result) => {
          if (err) {
            console.log('ERROR: Ошибка при добавлении участника\n');
            return res.status(500).send('ERROR: Ошибка при добавлении участника');
            
          }
          console.log('INFO: Участник добавлен\n');
          res.status(201).send('Участник добавлен');
        });

      } else {
        //если не существует - вывод соответствующей информации
        console.log('INFO: Пользователь не найден\n');
        return res.status(201).send('Пользователь не найден');
      }

    });

    
  });

  process.on('SIGINT', () => { 
    console.log('INFO: Закрытие соединения с базой данных...\n'); 
    db.end((err) => { 
        if (err) { 
            console.error('ERROR: Ошибка при закрытии соединения с базой данных:\n', err); 
        } else { 
            console.log('INFO: Соединение с базой данных закрыто\n'); 
        } 
        process.exit(); 
    }); 
});
  
  // Запуск сервера
  app.listen(port, () => {
    console.log('INFO: Сервер запущен на порту 3000\n');

  });

//   db.end((err) => {
//     if (err) {
//         return console.log('Error closing: ', err.message);
//     }
//     console.log('Соединение закрыто');
//     process.exit();
//   });
});
