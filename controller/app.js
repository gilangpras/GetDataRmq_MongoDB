const router = require('express').Router()
const q = 'Log_Login';
const { default: mongoose } = require('mongoose');
const mongo = require('mongoose')
const db = mongo.connection

// UNTUK MELAKUKAN KONEKSI KE RABBITMQ
const koneksiRmq = () => {
    require('amqplib/callback_api').connect({ protocol: 'amqp', hostname: 'iwkrmq.pptik.id', port: '5672', username: 'trainerkit', password: '12345678', vhost: '/trainerkit' }, function (err, conn){
        try {
            if (err) {
                console.log ("Tidak ada Koneksi Jaringan")
                reconnect();
            }else{
                console.log("Terhubung ke RMQ")
                consumer(conn);
            }
        } catch (error) {
            console.log("Terjadi Kesalahan Server di RabbitMQ")
        }


    });
}

koneksiRmq()

// UNTUK MENGCONSUME DATA DARI RABBITMQ
function consumer(conn) {
    try {
        const sukses = conn.createChannel(on_open);
        function on_open(err, ch) {
            ch.consume(q, function(msg){
                if(msg == null) {
                    console.log("Pesan Tidak Ada")
                } else {
                    console.log(msg.content.toString());
                    ch.ack(msg);
                    var json = msg.content.toString();
                    const obj = JSON.parse(json);
                    console.table(obj)
                    const History = { 
                        id_user: obj.id_user,
                        nama: obj.nama,
                        time: obj.time
                     }
                    try {
                        Save(History)
                    } catch (error) {
                        console.log("Error")
                    }
                }
            })
        }
    } catch (error) {
        console.log("Error")
    }
}

// UNTUK MENGKONEKSIKAN KE MONGODB
function koneksi() {
    mongo.connect("mongodb://127.0.0.1:27017/testinguser", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }) 
    try {
        db.once('open', ()=> console.log("Berhasil Terhubung ke database"))
    } catch (error) {
        db.on('error', error=> console.log(error))
        console.log(console.error)
    }
}

// UNTUK MENYIMPAN DATA KE MONGODB
function Save(history) {
    mongoose.set('strictQuery', false);
    koneksi()
    try {
        db.collection("Log_Login").insertOne(history, function(err){
            if (err){
                console.log("Gagal")
            } else {
                console.log("Berhasil Menyimpan Data Ke Database")
            }
        });
    } catch (error) {
        console.log("Errror")
        
    }  
}

// UNTUK RECONNECT APABILA TIDAK BISA DI
function reconnect() {
    console.log("menghubungkan ulang ke RabbitMq")
    koneksiRmq(artInterval, 1000);
}

module.exports = {router, koneksi}