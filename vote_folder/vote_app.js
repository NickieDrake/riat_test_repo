const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const amqp = require('amqplib/callback_api');

//const app = express();
const app = express();
const port = 3002;

amqp.connect('amqp://localhost:5672', (err, connection) => {
  if (err) {
    throw err;
  }
  connection.createChannel((err, channel) => {
    if (err) {
      throw err;
    }

    const queue = 'task_queue';

    channel.assertQueue(queue, {
      durable: false
    });

    

    //console.log(" [x] Sent %s", msg);
  

  

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
  db.query('CREATE TABLE IF NOT EXISTS Votes (id INT AUTO_INCREMENT PRIMARY KEY, part_id INT, vote TINYINT(1))', 
    (err, result) => {
    if (err) throw err;
    console.log('INFO: Таблица голосов создана или уже существует\n');
  });
  
  // Middleware для парсинга JSON
  app.use(bodyParser.json());

  app.get('/votes_check', (req, res) => {
    const { part_id } = req.body;
    const query_check = 'SELECT * FROM Votes WHERE part_id = ?';
    db.query(query_check, [part_id], (err, results) => {
      if (err) {
        console.log('ERROR: Ошибка при поиске голосов\n');
        return res.status(500).send('ERROR: Ошибка при поиске голосов');
        
      }
      console.log('INFO: Количество голосов: ', results.length, '\n');
      res.status(500).send('INFO: Количество голосов подсчитано');
    });
  });

  
  // Маршрут для добавления пользователя

  app.post('/votes', (req, res) => {
    const { part_id, vote } = req.body;

    const query_check = 'SELECT * FROM Partisipants WHERE id_part = ?';
    db.query(query_check, [part_id], (err, result) => {
      if (err) {
        console.log('ERROR: Ошибка при поиске участника\n');
        return res.status(500).send('ERROR: Ошибка при поиске участника');
        
      }
      if (result.length > 0) {
        // если есть необходимый участник
        const query = 'INSERT INTO Votes (part_id, vote) VALUES (?, ?)';
        db.query(query, [part_id, vote], (err, result) => {
          if (err) {
            console.log('ERROR: Ошибка при добавлении голоса\n');
            return res.status(500).send('ERROR: Ошибка при добавлении голоса');
        
          }
            const msg = 'VOTE';
            channel.sendToQueue(queue, Buffer.from(msg));
            console.log('Создание уведомления:', msg);

            console.log('INFO: Голос учитан с уведомлением\n');
           res.status(201).send('Голос учитан с уведомлением');
       });
      } else {
        // если нет необходимого учестника
        console.log('INFO: Участник не найден\n');
        return res.status(201).send('Участник не найден');
      }
    });

    
  });

  process.on('SIGINT', () => { 
    console.log('INFO: Закрытие соединения с базой данных...\n'); 
    db.end((err) => { 
        if (err) { 
            console.error('ERROR: Ошибка при закрытии соединения с базой данных:', err); 
        } else { 
            console.log('INFO: Соединение с базой данных закрыто\n'); 
        } 
        connection.close();
        process.exit(); 
    }); 
  });
  
  // Запуск сервера
  app.listen(port, () => {
    console.log('INFO: Сервер запущен на порту 3002\n');

  });

 });//connect db
 });//create channel

});//start rabbitmq
