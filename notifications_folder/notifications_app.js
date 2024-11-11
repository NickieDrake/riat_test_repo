const express = require('express');
const mysql = require('mysql2');
const amqp = require('amqplib/callback_api');

const app = express();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'nuck',
    database: 'riat'
});

db.connect(err => {
    if (err) throw err;
    console.log('INFO: Подключено к базе данных MySQL\n');
});

db.query('CREATE TABLE IF NOT EXISTS Notifications (id INT AUTO_INCREMENT PRIMARY KEY, mess VARCHAR(255), user_id INT)', 
    (err, result) => {
    if (err) throw err;
    console.log('INFO: Таблица уведомлений создана или уже существует\n');
  });

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
  
      console.log("INFO: Ожидание сообщений...\n", queue);
  
      channel.consume(queue, (msg) => {
        if (msg.content.toString() == 'VOTE') {
            const sql = 'SELECT * FROM Votes ORDER BY id DESC LIMIT 1';
            db.query(sql, (err, results) => {
                if (err) throw err;
                
                    const lastvote = results[0];
                    const notification = 'Новый голос за вашего участника!\n';
                    const sql = 'INSERT INTO Notifications (mess, user_id) VALUES (?, ?)';
                    db.query(sql, [notification, lastvote.id], (err, result) => {
                        if (err) throw err;
                        console.log('INFO: Уведомление отправлено:', notification);
                    });
                
                //res.send('INFO: Уведомление отправлено');
            });
        } else {
            console.log('INFO: Неизвестное сообщение\n');
        }
        //console.log(" [x] Received %s", msg.content.toString());
      }, {
        noAck: true
      });
    });
  });




  //вместо гет запроса - получение из очереди и проверка его значения, 
  //если vote - уведа про воут, если - partisipant - поздравляем, вы новый участник
app.get('/notifs', (req, res) => {
    const sql = 'SELECT * FROM Votes ORDER BY id DESC LIMIT 1';
    db.query(sql, (err, results) => {
        if (err) throw err;
        
            const lastvote = results[0];
            const notification = 'Новый голос за вашего участника!';
            const sql = 'INSERT INTO Notifications (mess, user_id) VALUES (?, ?)';
            db.query(sql, [notification, lastvote.id], (err, result) => {
                if (err) throw err;
                console.log('INFO: Уведомление отправлено:', notification);
            });
        
        res.send('INFO: Уведомление отправлено');
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
        process.exit(); 
    }); 
});

app.listen(3001, () => {
    console.log('INFO: Сервер запущен на порту 3001\n');
});
